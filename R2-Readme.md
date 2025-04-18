R2 upload file

https://r2-worker-4db24dcd0d2b.herokuapp.com/

/upload  - method post
    payload FormData {
        file: file,
        idproduct: string,
        isComment: option<bool>
    }


/delComment/:idProduct/:fileName (comment)  - method delete
    path


/delete/:idProduct/:fileName (admin) - method delete
    path