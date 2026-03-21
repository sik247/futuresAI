import { create } from "zustand";

export interface RichTextState {
  richText: string;
  setRichText: (richText: string) => void;
  updateRichText: (richText: string) => void;
  insertText: (newText: string) => void;
  resetRichText: () => void;
}

export const richTextStore = create<RichTextState>((set) => ({
  richText: "",
  setRichText: (richText) => set({ richText }),
  insertText: (newText: string) =>
    set((state) => ({ richText: state.richText + newText })),
  updateRichText: (newRichText) =>
    set((state) => ({ richText: state.richText + newRichText })),
  resetRichText: () => set({ richText: "" }),
}));
export interface CommentTextState {
  commentText: string;
  setCommentText: (commentText: string) => void;
  updateCommentText: (commentText: string) => void;
  insertText: (newText: string) => void;
  resetCommentText: () => void;
}

export const commentTextStore = create<CommentTextState>((set) => ({
  commentText: "",
  setCommentText: (commentText) => set({ commentText }),
  insertText: (newText: string) =>
    set((state) => ({ commentText: state.commentText + newText })),
  updateCommentText: (newCommentText) =>
    set((state) => ({ commentText: state.commentText + newCommentText })),
  resetCommentText: () => set({ commentText: "" }),
}));
