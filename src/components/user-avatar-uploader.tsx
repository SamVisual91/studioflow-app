"use client";

type UserAvatarUploaderProps = {
  action: (formData: FormData) => void | Promise<void>;
  avatarImage?: string | null;
  returnPath: string;
};

export function UserAvatarUploader({
  action,
  avatarImage,
  returnPath,
}: UserAvatarUploaderProps) {
  return (
    <form action={action} className="grid gap-2">
      <input name="returnPath" type="hidden" value={returnPath} />
      <label className="group relative block cursor-pointer">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sidebar)] bg-cover bg-center text-sm font-semibold text-white"
          style={avatarImage ? { backgroundImage: `url(${avatarImage})` } : undefined}
        >
          {!avatarImage ? "You" : null}
        </span>
        <span className="absolute -bottom-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[0.6rem] font-semibold text-[var(--ink)] shadow-[0_8px_16px_rgba(17,15,14,0.18)] transition group-hover:scale-105">
          +
        </span>
        <input
          accept="image/*"
          className="sr-only"
          name="avatar"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          type="file"
        />
      </label>
    </form>
  );
}
