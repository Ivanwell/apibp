const { Item_whole, Category, Item_direct, Link } = require('../../../models/models.js')
const { createOnlyLinkInBM, devideOnChunks } = require('../../../scripts/common_functions/functions.js')
var fs = require('fs');

const GetMainInfo = async function (req, res, next) {
    
    try{
        
        const allItems = await Item_whole.find({}).count().exec()
        const allItemsWhitoutLinks = await Item_whole.find({link : undefined || []}).count().exec()
        const allItemsWhitoutImage = await Item_whole.find({image : '-'}).count().exec()
        const allItemsWhitoutCategory = await Item_whole.find({categories : []}).count().exec()
        const allLinks = await Link.find({}).count().exec()
        
        res.status(200).json({ allItems, allItemsWhitoutLinks, allItemsWhitoutImage, allItemsWhitoutCategory, allLinks });
        
    
    }catch(error){
        
        res.status(500).json(error);
        
    }
}

const GiveMainInfoSuplier = async function (req, res, next) {
    try {

        const suplierID = req.query.suplier.toUpperCase()
        const article = req.query.article
        const filterPrice = +req.query.filterPrice
        const page = +req.query.page
        
        const filter = article !== 'undefined' ? {suplierID, article} : filterPrice !== 'undefined' ? {suplierID, "$expr" : {"$gt" : [{"$toInt" :"$price"} , filterPrice]}} : {suplierID}
        
        const item = await Item_direct.find(filter).populate('itemWhole').skip(page*15).limit(15).exec()
        const itemCount = await Item_direct.count({suplierID});

        const obj={
            products : item,
            amount : itemCount
        }
        res.status(200).json(obj);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}

async function createChunkLinks (chunk) {
    
    try{
        const promises = chunk.map(item => createOneLink(item))
    
        const data = Promise.all(promises).then((values) => {
          return(values);
        });
        
        return data
    } catch (err) {
        
    }
}

async function createOneLink (data) {
    try{
        const item = await Item_whole.findOne({article : data.article, brand : data.brand})
        const createdLink = await createOnlyLinkInBM(data.title, data.brand, data.article, './routes/api/info/links.txt')
        item.link.push(createdLink)
        await item.save() 
        return 'ok'
    } catch (err) {
        fs.appendFile('./routes/api/info/links.txt', `ERROR --------  ${err.message}`+ "\n", err => {
              if (err) {
                console.error(err);
              }
        })
        return 'failed'
    }
    
}

const CreateAllLinksForSuplier = async function (req, res, next) {
    
    try {
        const arrayWhioutLinks = await Item_whole.find({link : [] || undefined}).limit(1000).exec()
        
        const newChunks = devideOnChunks(arrayWhioutLinks)
    
        for (chunk of newChunks) {
            
        const creating = await createChunkLinks(chunk)
        const amount = creating.reduce((n, value) => {
            return n + (value === 'ok')
        }, 0)
        
        fs.appendFile('./routes/api/info/links.txt', `${amount} units ssucced`+ "\n", err => {
              if (err) {
                console.error(err);
              }
        })
    }
    
        res.status(200).json(arrayWhioutLinks);
    } catch(err){
        fs.appendFile('./routes/api/info/links.txt', `ERROR --------  ${err.message}`+ "\n", err => {
              if (err) {
                console.error(err);
              }
        })
    }
    
    
}

module.exports = { GetMainInfo, GiveMainInfoSuplier, CreateAllLinksForSuplier }