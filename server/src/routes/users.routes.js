/**
 * User: abhijit.baldawa
 */

const
    express = require('express'),
    usersController = require('../controller/users.controller'),
    router = express.Router();

router.get('/', [
    usersController.getAllUsers
]);

router.post('/', [
    usersController.createUser
]);

router.post('/sell', [
    usersController.sellStock
]);

module.exports = router;