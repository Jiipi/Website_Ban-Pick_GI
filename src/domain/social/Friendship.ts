export type FriendshipStatus = "PENDING" | "ACCEPTED" | "BLOCKED";

export type FriendshipRecord = {
  id: string;
  requesterUid: string;
  addresseeUid: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type FriendProfile = {
  id: string;
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  status: FriendshipStatus;
  direction: "OUTGOING" | "INCOMING" | "MUTUAL";
  since: Date;
};
