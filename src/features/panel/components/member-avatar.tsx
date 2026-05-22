import { getMemberInitials, type BadernaMember } from "@/features/panel/members-data";

export function MemberAvatar({
  member,
  size = 64,
}: {
  member: BadernaMember;
  size?: number;
}) {
  if (member.avatarSrc) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img
          src={member.avatarSrc}
          alt={member.nickname}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#131313] text-[14px] font-black tracking-[-0.03em] text-white"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {getMemberInitials(member.nickname)}
    </div>
  );
}
