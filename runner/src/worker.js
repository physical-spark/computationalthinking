import * as Comlink from "comlink";
import {
  loadPyodideAndPackage,
  makeRunnerCallback,
  pyodideExpose,
  PyodideFatalErrorReloader,
} from "pyodide-worker-runner";
self.postMessage({ diagnostic: "Python 코어 로딩을 시작합니다." });
const reloader = new PyodideFatalErrorReloader(async () => {
  const loaderUrl = "/pyodide/pyodide.mjs";
  const { loadPyodide } = await import(/* @vite-ignore */ loaderUrl);
  self.postMessage({ diagnostic: "Python 엔진을 초기화합니다." });
  const py = await loadPyodideAndPackage(
    { url: __CT_PYTHON_CORE_URL__, format: "gztar" },
    () => loadPyodide({ indexURL: "/pyodide/" }),
  );
  self.postMessage({ diagnostic: "학습 코어를 초기화합니다." });
  py.pyimport("core.init_pyodide").init(
    import.meta.env.VITE_CONTENT_LANGUAGE || "ko",
  );
  return py;
});
const run = pyodideExpose(async (extras, entry, output, input) => {
  const callback = makeRunnerCallback(extras, {
    input: () => input(),
    output: (parts) => output(parts),
    other: () => {},
  });
  return reloader.withPyodide(async (py) => {
    const core = py.pyimport("core.checker");
    const cls = py
      .pyimport("core.text")
      .pages.get(entry.page_slug)
      ?.get_step(entry.step_name);
    const key = entry.page_slug + "." + entry.step_name;
    if (key !== self.lastStep && cls) {
      cls.pre_run(core.default_runner);
      self.lastStep = key;
    }
    if (entry.source === "pythontutor") {
      py.runPython(
        `import sys\n_ct_trace=[]\ndef _ct_tracer(frame, event, arg):\n    if frame.f_code.co_filename == '/my_program.py' and event in ('line','return') and len(_ct_trace)<500:\n        _ct_trace.append({'line':frame.f_lineno,'event':event,'function':frame.f_code.co_name,'locals':{k:repr(v)[:300] for k,v in frame.f_locals.items() if not k.startswith('_') and k != 'assert_equal'}})\n    return _ct_tracer\nsys.settrace(_ct_tracer)`,
      );
    }
    let result;
    try {
      result = entry.page_slug.startsWith("m1-")
        ? py.pyimport("module1").check(entry, callback)
        : core.check_entry(entry, callback);
    } finally {
      if (entry.source === "pythontutor") py.runPython("sys.settrace(None)");
    }
    const data = result.toJs({ dict_converter: Object.fromEntries });
    if (entry.source === "pythontutor")
      data.trace = py.globals
        .get("_ct_trace")
        .toJs({ dict_converter: Object.fromEntries });
    return data;
  });
});
reloader.pyodidePromise.catch((error) =>
  self.postMessage({ diagnostic: "Python 준비 오류: " + error.message }),
);
Comlink.expose({
  run,
  regression: () =>
    reloader.withPyodide((py) =>
      py
        .pyimport("regression")
        .verify(import.meta.env.VITE_CONTENT_LANGUAGE || "ko")
        .toJs({ dict_converter: Object.fromEntries }),
    ),
  ready: () => reloader.pyodidePromise.then(() => true),
});
