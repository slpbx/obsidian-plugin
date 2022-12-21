import {Timestamp} from "@firebase/firestore";

export interface PendingNote {
    text: string;
    createdAt: Timestamp;
    userId: string;
}
