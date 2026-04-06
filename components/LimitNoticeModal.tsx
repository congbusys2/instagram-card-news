"use client";

type LimitNoticeModalProps = {
  open: boolean;
  onClose: () => void;
};

const MESSAGE = `요청이 많아 잠시 자동 생성이 제한되고 있어요 😢
잠시 후 다시 시도하시거나, 직접 문구를 입력해보세요.`;

export function LimitNoticeModal({ open, onClose }: LimitNoticeModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-notice-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <h2
          id="limit-notice-title"
          className="text-lg font-semibold text-white"
        >
          안내
        </h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
          {MESSAGE}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
