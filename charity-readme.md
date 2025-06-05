## charity

TypeEntity = {
1: "post",
2: "story",
3: "video-activity",
};

upload_file (post /charity/upload)
payload {
file: FileType
type: i8
idEntity: i32
}

delete_file (delete /charity/delete)
payload {
idEntity: i32,
fileName: String,
type: i8,
}
