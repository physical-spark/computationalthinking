import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
const highlighting = HighlightStyle.define([
  { tag: tags.keyword, color: "var(--code-keyword)" },
  { tag: tags.name, color: "var(--text)" },
  { tag: tags.string, color: "var(--code-string)" },
  { tag: tags.number, color: "var(--code-number)" },
  { tag: tags.comment, color: "var(--muted)" },
  { tag: tags.operator, color: "var(--code-operator)" },
  { tag: tags.punctuation, color: "var(--code-operator)" },
  { tag: tags.function(tags.variableName), color: "var(--code-function)" },
  { tag: tags.typeName, color: "var(--code-type)" },
  { tag: tags.bool, color: "var(--code-type)" },
]);
export default function Editor({
  value,
  onChange,
  readOnly = false,
  onRun,
  shell,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  onRun: () => void;
  shell: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latest = useRef({ onChange, onRun, shell });
  latest.current = { onChange, onRun, shell };
  const history = useRef<string[]>([]);
  const position = useRef(0);
  function execute() {
    if (latest.current.shell && view.current) {
      const code = view.current.state.doc.toString();
      if (history.current.at(-1) !== code) history.current.push(code);
      position.current = history.current.length;
    }
    latest.current.onRun();
    return true;
  }
  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      doc: value,
      extensions: [
        EditorView.editable.of(!readOnly),
        keymap.of([
          {
            key: "Enter",
            run: (v) =>
              latest.current.shell && !v.state.doc.toString().includes("\n")
                ? execute()
                : false,
          },
          {
            key: "ArrowUp",
            run: () => {
              if (!latest.current.shell || !history.current.length)
                return false;
              position.current = Math.max(0, position.current - 1);
              latest.current.onChange(history.current[position.current]);
              return true;
            },
          },
          {
            key: "ArrowDown",
            run: () => {
              if (!latest.current.shell || !history.current.length)
                return false;
              position.current = Math.min(
                history.current.length,
                position.current + 1,
              );
              latest.current.onChange(history.current[position.current] || "");
              return true;
            },
          },
          { key: "Ctrl-Enter", run: execute },
          { key: "Cmd-Enter", run: execute },
        ]),
        basicSetup,
        python(),
        EditorView.theme(
          {
            "&": { color: "var(--text)", backgroundColor: "var(--code-bg)" },
            ".cm-content": { caretColor: "var(--text)" },
            ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--text)" },
            "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
              {
                backgroundColor: "var(--code-selection)",
              },
            ".cm-matchingBracket, .cm-nonmatchingBracket": {
              backgroundColor: "var(--accent-soft)",
              color: "var(--text)",
            },
          },
          { dark: false },
        ),
        syntaxHighlighting(highlighting),
        EditorView.contentAttributes.of({ "aria-label": "Python 코드 편집기" }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) latest.current.onChange(u.state.doc.toString());
        }),
        EditorView.lineWrapping,
      ],
    });
    view.current = v;
    return () => v.destroy();
  }, []);
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value)
      v.dispatch({
        changes: { from: 0, to: v.state.doc.length, insert: value },
      });
  }, [value]);
  return <div className="editor" ref={host} />;
}
