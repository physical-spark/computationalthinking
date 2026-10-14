"""Compile complete protected Korean terms, then validate every original key."""

import json, re
from pathlib import Path
import polib

ROOT = Path(__file__).resolve().parents[1]
source = polib.pofile(str(ROOT / "vendor/futurecoder/translations/english.po"))
drafts = json.loads((ROOT / "content/ko.json").read_text())
overrides = (
    json.loads((ROOT / "content/ko-overrides.json").read_text())
    if (ROOT / "content/ko-overrides.json").exists()
    else {}
)
missing = []
problems = []
translated = polib.POFile()
translated.metadata = {
    "Language": "ko",
    "Content-Type": "text/plain; charset=UTF-8",
    "Content-Transfer-Encoding": "8bit",
    "Plural-Forms": "nplurals=1; plural=0;",
}
for entry in source:
    text = overrides.get(entry.msgid, drafts.get(entry.msgid, {}).get("text"))
    if (
        entry.msgid.startswith("code_bits.")
        or entry.msgid.endswith(".program")
        or ".output_prediction_choices." in entry.msgid
    ):
        text = entry.msgstr
    if text is None:
        missing.append(entry.msgid)
        continue
    if re.findall(r"__\w+__", text) != re.findall(r"__\w+__", entry.msgstr):
        problems.append((entry.msgid, "template markers"))
    if sorted(re.findall(r"`[^`\n]+`", text)) != sorted(re.findall(r"`[^`\n]+`", entry.msgstr)):
        problems.append((entry.msgid, "inline code"))
    if entry.msgid.startswith("code_bits.") and text != entry.msgstr:
        problems.append((entry.msgid, "code bit changed"))
    for marker in re.findall(r"__code\d+__", text):
        if not re.search(r"^ *" + marker + r"\s*$", text, re.MULTILINE):
            problems.append((entry.msgid, "code block marker must occupy its own line"))
    if re.search(r"</?think>|/no_think|ZXQ\d|<\|im_", text):
        problems.append((entry.msgid, "generation artifact"))
    translated.append(polib.POEntry(msgid=entry.msgid, msgstr=text))
report = {
    "total": len(source),
    "available": len(source) - len(missing),
    "missing": missing,
    "problems": problems,
    "reviewed_overrides": len(overrides),
    "translation_method": "Local Qwen translation drafts plus reviewed corrections; code, identifiers and expected outputs retained.",
}
(ROOT / "content/translation-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n"
)
if missing or problems:
    raise SystemExit(
        f"Korean content incomplete: {len(missing)} missing, {len(problems)} integrity errors. See content/translation-report.json"
    )
folder = ROOT / "vendor/futurecoder/translations/locales/ko/LC_MESSAGES"
folder.mkdir(parents=True, exist_ok=True)
translated.save(str(folder / "futurecoder.po"))
translated.save_as_mofile(str(folder / "futurecoder.mo"))
print(f"PASS: {len(source)} Korean entries, exact code and template markers retained")
