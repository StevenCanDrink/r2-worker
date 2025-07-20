# charity && hrbio

var project: charity||biohr

upload_file (post /{project}/upload)
path + payload {
file: FileType
}

delete_file (delete /{project}/delete/{fileName})
path
