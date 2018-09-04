var express = require('express');
var router = express.Router();
var fs = require('fs')
var path = require('path')
var formidable = require('formidable'),
TITLE = '文件上传',
AVATAR_UPLOAD_FOLDER = '/upload/动作/';
var imgArr = []
var dirArr = []
const mongoClient = require('mongodb').MongoClient;
const dbUrl = 'mongodb://localhost:27017';
const dbName = 'login'
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});
router.get('/login', function (req, res, next) {
    res.render('login', {title: 'login'})
})
router.get('/wz', function (req, res, next) {
    res.render('wz', {title: 'wz'})
})
router.get('/about', function (req, res, next) {
    res.render('about', {title: 'about'})
})
router.get('/sy', function (req, res, next) {
    res.render('sy', {title: 'sy'})
})
router.get('/news', function (req, res, next) {
    res.render('news', {title: 'news'})
})
router.get('/newlist', function (req, res, next) {
    res.render('newlist', {title: 'newlist'})
})
router.get('/test', function (req, res, next) {
    res.render('test', {title: 'test'})
})
router.get('/fj', function (req, res, next) {
    res.render('fj', {title: 'fj'})
})
//注册
router.post('/dorigester', function (req, res) {
    let Email = req.body.Email;
    let Password = req.body.Password;
    __connectDB((err, db) => {
        if (err) {
            console.log(err)
            return
        }
        let collection = db.collection('Email')
        collection.find({Email: Email}).toArray((err, docArr) => {
            if (err) {
                console.log(err)
                res.send('注册失败')
                return
            }
            if (docArr.length > 0) {
                console.log(docArr)
                res.send('用户名已被注册')
                return
            } else {
                collection.insertMany([{Email, Password}], (err, result, client) => {
                        if (err) {
                            console.log(err);
                            client.close();
                            res.send('注册失败')
                            return
                        }
                        console.log(result)
                        res.redirect('/login')

                    }
                )
            }

        })
    })

})
//登录
router.post('/dologin', function (req, res) {
    let Email = req.body.Email;
    let Password = req.body.Password;
    __connectDB((err, db, client) => {
        if (err) {
            console.log(err)
            return
        }
        let collection = db.collection('Email')
        collection.find({Email: Email}).toArray(function (err, docs) {
            if (err) {
                console.log(err)
                return
            }
            if (docs.length <= 0) {
                res.send('用户不存在')
                return
            } else {
                if (docs[0].Password == Password) {
                    res.redirect("/sy")
                    return
                } else {
                    res.send('请输入正确密码')
                    return;
                }

            }
        })
    })
})

//文字输入显示
// router.get('/xs', function (req, res) {
//     __connectDB(function (err, db, client) {
//         var collection = db.collection('Email')
//       collection.find({wz:wz}).toArray(function(err, result) {
//             if (err) {
//               console.log(err)
//                 return
//             }
//            console.log(result)
//             db.close();
//         });
//     })
//
// })
//
// //插入文字
// router.post('/dowrite', function (req, res) {
//     var wz = req.body.wz;
//     __connectDB(function (err, db, client) {
//         var collection = db.collection('Email')
//                 collection.insertMany([{wz}], function (err, result, client) {
//                     if (err) {
//                         console.log(err)
//                         client.close();
//                         res.send('写入文字失败')
//                         return
//                     }
//                     res.redirect("/xs")
//                 })
//
//         })
//
//     })
//相册首页
//读取文件夹
router.get('/share', function (req, res) {
    fs.readdirSync(path.normalize(path.join(__dirname, '../public/upload'))).forEach(function (flieds) {
        let stat = fs.statSync(path.join(__dirname, '../public/upload', flieds))
        if (stat.isDirectory()) {
            dirArr.push(flieds)
        }
    })
    res.render('share', {title: '相册', dirArr: dirArr});
    dirArr = []
})
//照片
router.get('/show/:name', function (req, res, next) {
    let dir = req.params.name
    fs.readdirSync(path.normalize(path.join(__dirname, '../public/upload', dir))).forEach(function (file) {

        let stat = fs.statSync(path.join(__dirname, '../public/upload', dir, file))
        if (stat.isFile()) {
            imgArr.push(dir + "/" + file)
        }
        console.log(imgArr)

    })
    res.render('show', {title: '相册', imgArr: imgArr})
    imgArr = []


})
//图片上传
router.post('/show/:name', function(req, res) {
    let dir = req.params.name
    fs.readdirSync(path.normalize(path.join(__dirname, '../public/upload', dir))).forEach(function (file) {

        let stat = fs.statSync(path.join(__dirname, '../public/upload', dir, file))
        if (stat.isFile()) {
            imgArr.push(dir + "/" + file)
        }
        console.log(imgArr)

    })
    //创建上传表单
    var form = new formidable.IncomingForm();
    //设置编辑
    form.encoding = 'utf-8';
    //设置上传目录
    form.uploadDir = 'public' + AVATAR_UPLOAD_FOLDER;
    //保留后缀
    form.keepExtensions = true;
    //文件大小 2M
    form.maxFieldsSize = 2 * 1024 * 1024;
    // 上传文件的入口文件
    form.parse(req, function(err, fields, files) {
        if (err) {
            res.locals.error = err;
            return;
        }
        var extName = '';  //后缀名
        switch (files.fulAvatar.type) {
            case 'image/pjpeg':
                extName = 'jpg';
                break;
            case 'image/jpeg':
                extName = 'jpg';
                break;
            case 'image/png':
                extName = 'png';
                break;
            case 'image/x-png':
                extName = 'png';
                break;
        }

        if(extName.length == 0) {
            res.locals.error = '只支持png和jpg格式图片';
            return;
        }
//重命名
        var avatarName = Math.random() + '.' + extName;
        var newPath = form.uploadDir + avatarName;
        fs.renameSync(files.fulAvatar.path, newPath);
    });

    res.render('show', {title: '相册', imgArr: imgArr})
    imgArr = []

});


module.exports = router;
//数据库连接
function __connectDB(callback) {
    mongoClient.connect(dbUrl, (err, client) => {
        if (err) {
            console.log(err, 'err at function connect')
            callback('数据库连接失败', null, client);
            return
        }


        let db = client.db(dbName);
        callback(null, db, client)
    })
}