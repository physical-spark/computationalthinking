import { useState } from "react";
import { api } from "./api";
import type { User } from "./types";
export const avatars = [
  ["sprout", "🌱", "새싹"],
  ["cat", "🐱", "고양이"],
  ["dog", "🐶", "강아지"],
  ["fox", "🦊", "여우"],
  ["panda", "🐼", "판다"],
  ["koala", "🐨", "코알라"],
  ["tiger", "🐯", "호랑이"],
  ["lion", "🦁", "사자"],
  ["rabbit", "🐰", "토끼"],
  ["bear", "🐻", "곰"],
  ["penguin", "🐧", "펭귄"],
  ["owl", "🦉", "부엉이"],
  ["whale", "🐳", "고래"],
  ["dolphin", "🐬", "돌고래"],
  ["turtle", "🐢", "거북이"],
  ["octopus", "🐙", "문어"],
];
export function Avatar({ id }: { id?: string | null }) {
  return (
    <span aria-hidden="true">
      {avatars.find((a) => a[0] === id)?.[1] || "🌱"}
    </span>
  );
}
export default function Profile({
  user,
  onSaved,
}: {
  user: User;
  onSaved: (u: User) => void;
}) {
  const [name, setName] = useState(user.full_name || ""),
    [birth, setBirth] = useState(user.birth_date || ""),
    [avatar, setAvatar] = useState(user.avatar_id || ""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  return (
    <form
      className="profile-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
          const p = await api("/api/v1/me", "PATCH", {
            full_name: name,
            birth_date: birth,
            avatar_id: avatar,
          });
          onSaved({ ...user, ...p, nickname: p.full_name });
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <p>
        성명과 생년월일은 동명이인을 구분하고 학습을 관리하는 데 사용합니다.
        생년월일은 본인과 관리자만 볼 수 있습니다.
      </p>
      <label>
        성명
        <input
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
        />
      </label>
      <label>
        생년월일
        <input
          type="date"
          autoComplete="bday"
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          max={new Date().toLocaleDateString("en-CA")}
          required
        />
      </label>
      <fieldset>
        <legend>프로필 이모지 선택</legend>
        <div className="avatar-grid">
          {avatars.map(([id, emoji, label]) => (
            <label key={id} className={avatar === id ? "selected" : ""}>
              <input
                type="radio"
                name="avatar"
                value={id}
                checked={avatar === id}
                onChange={() => setAvatar(id)}
                required
              />
              <span aria-hidden="true">{emoji}</span>
              <span className="sr-only">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p role="alert">{error}</p>
      <button className="primary" disabled={saving}>
        {saving ? "저장 중…" : "프로필 저장"}
      </button>
      <p>
        <a href="/privacy">학습 기록과 개인정보 안내</a>
      </p>
    </form>
  );
}
