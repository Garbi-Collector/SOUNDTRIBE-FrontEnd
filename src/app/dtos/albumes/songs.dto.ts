export enum VoteType {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE'
}

export interface VoteMessage {
  songId: number;
  voteType: VoteType;
}
