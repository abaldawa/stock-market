/**
 * User: abhijit.baldawa
 *
 * This module exposes methods to perform CRUD operations on stocks collection.
 */

const
    mongoose = require('mongoose'),
    {ObjectId} = mongoose.Schema.Types,
    STATUS_ENUM = {
        AVAILABLE: "AVAILABLE",
        SOLD: "SOLD"
    },
    stockSchema = new mongoose.Schema({
        stockName: String,
        stockId: String,
        price: Number,
        currency: String,
        quantity: Number,
        sellerId: ObjectId,
        buyerId: ObjectId,
        status: String,
        createdAt: Date,
    }),
    StockModel = mongoose.model('stock', stockSchema);

function createStock( stockObj ) {
    return new StockModel(stockObj).save();
}

function totalStocksCount() {
    return StockModel.estimatedDocumentCount();
}

function getAllStocks() {
    return StockModel.find({}, {}, {sort: {createdAt: -1}});
}

function deleteStockByMongoId( _id ) {
    return StockModel.deleteOne({_id});
}

function getStockByDbId( _id ) {
    return StockModel.findOne({_id});
}

function updateStockByDbId( _id, updatedStockObj ) {
    return StockModel.updateOne({_id}, {$set: updatedStockObj});
}

function getStatusEnum() {
    return STATUS_ENUM;
}

function getStocks( query ) {
    return StockModel.find( query );
}

module.exports = {
    createStock,
    totalStocksCount,
    getAllStocks,
    deleteStockByMongoId,
    getStockByDbId,
    updateStockByDbId,
    getStatusEnum,
    getStocks
};