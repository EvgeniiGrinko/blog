const express = require('express');
const router = express.Router();
const moment = require('moment');
moment.locale('ru');
const showdown = require('showdown');

const config = require('../config');
const models = require('../models');
const { findOne } = require('../models/post');

async function posts(req, res){
    const userId = req.session.userId;
    const userLogin = req.session.userLogin;
    const perPage = +config.PER_PAGE;
    const page = req.params.page || 1;

    try {
      let posts = await models.Post.find({
        status: "published"
      })
    .skip(perPage*page - perPage)
    .limit(perPage)
    .populate('owner')
    .populate('uploads')
    .sort({ createdAt: -1 });
    const converter = new showdown.Converter();
    posts = posts.map( await function(post) {
      let body = post.body;
      console.log(post);
      if (post.uploads.length) {
       post.uploads.forEach( upload => {
          body = body.replace(`image${upload.id}`,`/${config.DESTINATION}${upload.path}`)
          
        });
      }
      return Object.assign(post, {
        body: converter.makeHtml(body)
      }
        );
    });

    //console.log(posts);
    const count = await models.Post.countDocuments();
    res.render('archive/index', {
      posts,
      current: page,
      pages: Math.ceil(count/perPage),
      user: {
        id: userId, 
        login: userLogin
      }
    })
  } catch (error) {
      throw new Error('Server error');
    }
    

  

    // models.Post.find({}).skip(perPage*page - perPage)
    // .limit(perPage)
    // .populate('owner')
    // .sort({createdAt: -1})
    // .then(posts =>{
    //   // console.log(posts);
    //     models.Post.count().then(count => {
    //         res.render('archive/index', {
    //             posts,
    //             current: page,
    //             pages: Math.ceil(count/perPage),
    //             user: {
    //               id: userId, 
    //               login: userLogin
    //             }
    //           });
    //     }).catch(()=>{
    //       throw new Error('Server error')
    //     });

    // }).catch(()=>{
    //   throw new Error('Server error')
    // });
}

//routers
router.get('/', (req, res) => posts(req, res));

router.get('/archive/:page', (req, res) => posts(req, res));

router.get('/posts/:post', async (req, res) => {
  const url = req.params.post.trim().replace(/ +(?=)/g, ' '); 
  const userId = req.session.userId;
  const userLogin = req.session.userLogin;
  
  if(!url){
  const err = new Error('Not found');
  err.status = 404;
 
  } else {
    try {
      const post = await models.Post.findOne({
        url,
        status: "published"
      }).populate('uploads');
      if (!post){
        const err = new Error('Not found');
        err.status = 404;
        
      } else {
        const comments = await models.Comment.find({
          post: post.id,
          parent: { $exists: false}
      });
    //   .populate({
    //     path: 'children',
    //     populate: {
    //       path: 'children',
    //       populate: {
    //         path: 'children',
    //         populate: {
    //           path: 'children',
    //           populate: {
    //             path: 'children'
    //       }
    //     }
    //   }
    // }}
    //   );
    const converter = new showdown.Converter();

    let body = post.body;
    if (post.uploads.length) {
      post.uploads.forEach(upload => {
        body = body.replace(`image${upload.id}`,`/${config.DESTINATION}${upload.path}`);
        
      });
    }
    
        res.render('post/post', {
          post: Object.assign(post, {
            body: converter.makeHtml(body)
          }
            ),
          comments,
          moment,
          user: {
            id: userId, 
            login: userLogin
          }
        })
      }

    } catch (error) {
      throw new Error('Server error')
    }


    // models.Post.findOne({
    //   url
    // }).then(post=> {
    //   if (!post){
    //     const err = new Error('Not found');
    //     err.status = 404;
    //     next(err)
    //   } else {
    //     res.render('post/post', {
    //       post,
    //       user: {
    //         id: userId, 
    //         login: userLogin
    //       }
    //     })
    //   }
    // })
  }
});

//users posts

router.get('/users/:login/:page*?', async (req, res) => {
    const userId = req.session.userId;
    const userLogin = req.session.userLogin;
    const perPage = +config.PER_PAGE;
    const page = req.params.page || 1;
    const login = req.params.login;
try {
  const user =  await models.User.findOne({
    login
  });

  let posts = await models.Post.find({
    owner: user.id
  }).skip(perPage * page - perPage)
  .limit(perPage)
  .sort({createdAt: -1})
  .populate('uploads');

const count = await models.Post.countDocuments({
  owner: user.id
});


const converter = new showdown.Converter();

    posts = posts.map( post => {
      
      let body = post.body;
      
      if (post.uploads.length) {
        post.uploads.forEach(upload => {
          body = body.replace(`image${upload.id}`,`/${config.DESTINATION}${upload.path}`);
          
        });
      }
      return Object.assign(post, {
        body: converter.makeHtml(body)
      }
        );
    });
    
res.render('archive/user', {
  posts: posts,
  _user: user,
  current: page,
  pages: Math.ceil(count/perPage),
  user: {
    id: userId, 
    login: userLogin
  }
}, 

);
} catch  (error) {
  throw new Error('Server error'+ error);
}
//     models.User.findOne({
//       login
//     }).then(user => {
//       console.log(user);
//       models.Post.find({
//         owner: user.id
//       }).skip(perPage*page - perPage)
//     .limit(perPage)
//     .sort({createdAt: -1})
//     .then(posts =>{
//         console.log(posts)
//         models.Post.count({
//           owner: user.id
//         }).then(count => {
//             res.render('archive/user', {
//                 posts,
//                 _user: user,
//                 current: page,
//                 pages: Math.ceil(count/perPage),
//                 user: {
//                   id: userId, 
//                   login: userLogin
//                 }
//               });
//         }).catch(()=>{
//           throw new Error('Server error')
//         });

//     }).catch(()=>{
//       throw new Error('Server error')
//     });

//     }
//     )
    
});

module.exports = router;