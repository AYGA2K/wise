export enum TreeEntryTypes {
  BLOB = "blob",
  TREE = "tree"
}
export type TreeEntry = {
  name: string
  type: TreeEntryTypes
  mode: string
  hash: Buffer;
}
