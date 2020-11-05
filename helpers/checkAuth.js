// Check if user is logged
// const checkAuth = async (req, res, next) => {
//     try {
//         if(req.session.currentUser) {
//             res.locals.isLogged = true;
//           } else {
//             res.locals.isLogged = false; 
//           }
//           next();
//     } catch (error) {
//         // si hay un error, configuramos el valor de la variable isUserLoggedIn en false y pasamos el control a la siguiente ruta
//         console.log(error)
//         next(error)
//     }
// }

// module.exports = checkAuth;