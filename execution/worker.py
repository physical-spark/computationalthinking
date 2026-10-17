# ruff: noqa: E402
# The upstream initializer must run before importing its grading modules.
"""Runs ONLY inside an isolated sandbox. stdio is a bounded JSON-lines protocol."""

import json
import os
import sys
import threading

protocol_in, protocol_out = sys.stdin, sys.stdout
protocol_lock = threading.Lock()


def send(kind, **data):
    # Unbuffered pipe writes may be partial under backpressure. Preserve the
    # whole JSON frame, including output from learner-created threads.
    payload = memoryview((json.dumps({"type": kind, **data}, ensure_ascii=False) + "\n").encode())
    with protocol_lock:
        while payload:
            payload = payload[os.write(protocol_out.fileno(), payload) :]


def receive():
    line = protocol_in.readline(100_000)
    if not line:
        raise EOFError
    return json.loads(line)


from core.init_pyodide import init

init("ko")
import life_expression
import module1
from core.checker import check_entry, default_runner
from core.text import pages

# Writable work lives in tmpfs, never the host or application filesystem.
os.chdir("/tmp")
default_runner.filename = "/tmp/my_program.py"
last_step = None
send("ready")
while True:
    try:
        entry = receive()
    except EOFError:
        break
    trace = []

    def callback(kind, data):
        if kind == "output":
            send("output", parts=data["parts"])
        if kind == "input":
            send("input")
            return receive()["text"]

    try:
        key = entry["page_slug"] + "." + entry["step_name"]
        if not key.startswith("m1-") and key != last_step:
            pages[entry["page_slug"]].get_step(entry["step_name"]).pre_run(default_runner)
        last_step = key
        if entry["source"] == "pythontutor":

            def tracer(frame, event, arg):
                if (
                    frame.f_code.co_filename == default_runner.filename
                    and event in ("line", "return")
                    and len(trace) < 500
                ):
                    trace.append(
                        {
                            "line": frame.f_lineno,
                            "event": event,
                            "function": frame.f_code.co_name,
                            "locals": {
                                k: repr(v)[:300]
                                for k, v in frame.f_locals.items()
                                if not k.startswith("_") and k != "assert_equal"
                            },
                        }
                    )
                return tracer

            sys.settrace(tracer)
        try:
            result = (
                module1.check(entry, callback)
                if key.startswith("m1-")
                else check_entry(entry, callback)
            )
            result = life_expression.apply(entry, result)
        finally:
            sys.settrace(None)
        if entry["source"] == "pythontutor":
            result["trace"] = trace
        send("result", result=result)
    except BaseException as error:
        send("error", message=str(error)[:500] or type(error).__name__)
