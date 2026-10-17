import { useEffect, useState } from "react";
import { api } from "./api";
import type { User } from "./types";
import catalog from "../../content/avatars.json";
export const avatars = catalog;
export function Avatar({
  id,
  url,
}: {
  id?: string | null;
  url?: string | null;
}) {
  return url ? (
    <img className="profile-avatar" src={url} alt="" />
  ) : (
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
    [photo, setPhoto] = useState(user.avatar_url || ""),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const image = preview || photo;
  return (
    <form
      className="profile-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setNotice("");
        try {
          // Photo changes have their own endpoint so admins need not supply a birth date.
          let updated = file
            ? await api("/api/v1/me/avatar", "PUT", file)
            : !photo
              ? await api("/api/v1/me/avatar", "PATCH", { avatar_id: avatar })
              : {};
          if (!user.admin)
            updated = {
              ...updated,
              ...(await api("/api/v1/me", "PATCH", {
                full_name: name,
                birth_date: birth,
                avatar_id: avatar || "sprout",
              })),
            };
          const saved = { ...user, ...updated };
          saved.nickname = saved.full_name || user.nickname;
          setPhoto(saved.avatar_url || "");
          setFile(null);
          setAvatar(saved.avatar_id || "sprout");
          setNotice("프로필을 저장했습니다.");
          onSaved(saved);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      {!user.admin && (
        <>
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
              disabled={saving}
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
              disabled={saving}
            />
          </label>
        </>
      )}
      <fieldset disabled={saving} className="avatar-picker">
        <legend>프로필 이미지</legend>
        <div className="avatar-preview">
          <Avatar id={avatar} url={image} />
          <span>
            {image
              ? "선택한 사진"
              : avatars.find((a) => a[0] === avatar)?.[2] ||
                "이모지나 사진을 선택해 주세요"}
          </span>
        </div>
        <label>
          사진 업로드
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby="avatar-help"
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              e.target.value = "";
              if (!chosen) return;
              if (chosen.size > 5 * 1024 * 1024) {
                setError("사진은 5MB 이하로 선택해 주세요.");
                return;
              }
              if (
                !["image/jpeg", "image/png", "image/webp"].includes(chosen.type)
              ) {
                setError("JPG·PNG·WebP 사진을 선택해 주세요.");
                return;
              }
              setFile(chosen);
              setError("");
              setNotice("");
            }}
          />
        </label>
        <p id="avatar-help">
          JPG·PNG·WebP · 최대 5MB, 2천만 화소. 가운데를 기준으로 정사각형으로
          저장합니다. 사진은 본인과 관리자만 볼 수 있습니다.
        </p>
        <p>
          이모지 100개 중 하나를 선택해도 됩니다. 사진 대신 이모지를 선택하고
          저장하면 기존 사진이 삭제됩니다.
        </p>
        <fieldset>
          <legend>프로필 이모지 선택</legend>
          <div className="avatar-grid">
            {avatars.map(([id, emoji, label]) => (
              <label
                key={id}
                className={!image && avatar === id ? "selected" : ""}
                title={label}
              >
                <input
                  type="radio"
                  name="avatar"
                  value={id}
                  checked={!image && avatar === id}
                  onChange={() => {
                    setAvatar(id);
                    setFile(null);
                    setPhoto("");
                    setError("");
                    setNotice("");
                  }}
                  required={!image}
                />
                <span aria-hidden="true">{emoji}</span>
                <span className="sr-only">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>
      <p role="alert">{error}</p>
      <p role="status">{notice}</p>
      <button className="primary" disabled={saving}>
        {saving ? "저장 중…" : "프로필 저장"}
      </button>
      <p>
        <a href="/privacy">학습 기록과 개인정보 안내</a>
      </p>
    </form>
  );
}
