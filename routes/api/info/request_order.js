const axios = require('axios')
const { mongoose } = require("mongoose");
const { Order } = require('../../../models/models.js')
const dotenv = require('dotenv');
dotenv.config()

async function saySmth (data) {
     
     const options = {
    method: "GET",
    url: `https://api.telegram.org/bot6173056848:${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=@edetalRequests&text=${data}`,
    
  };

  axios
    .request(options)
    .then((response) => {

        return response
        
    })
      .catch((error) => {
      return "Помилка";
    });
 }

const LeaveRequest = async function (req, res, next) {
    
    try{
        const {article, brand, phone, vin, name} = req.body
        await saySmth(`Новий запит на перевірку. Вінкод ${vin} Артикул ${article} Бренд ${brand} Телефон ${phone} Клієнт ${name}`)
        res.status(200).json('request created')
    }catch(error){
        res.status(500).json(error);
    }
    
}

const LeaveRequestForSearch = async function (req, res, next) {
    
    try{
        const {part, phone, vin, name} = req.body
        await saySmth(`Новий запит на пошук. Вінкод ${vin} Запчастина ${part} Телефон ${phone} Клієнт ${name}`)
        res.status(200).json('request created')
    }catch(error){
        res.status(500).json(error);
    }
    
}

const CreateOrder = async function (req, res, next) {
  
  try {
    const ordersCount = await Order.find({}).countDocuments()

    const newOrder = new Order({
      _id : new mongoose.Types.ObjectId(),
      id: ordersCount + 1,
      products: req.body.products,
      delivery: req.body.delivery,
    })

    await newOrder.save()
    
    
    
    await saySmth(`Нове замовлення номер ${newOrder.id}`)

    res.status(200).json(newOrder.id)
  } catch (error) {
    res.status(500).json(error)
  }
}

const TestForm = async function (req, res, next) {
  
  try {
      let doesExist = req.query.code === '1111' ? true : false

    res.status(200).json({doesExist})
  } catch (error) {
    res.status(500).json(error)
  }
}

const TestDataBase = async function (req, res, next) {
    
    const device = {
        image : 'https://www.cnet.com/a/img/resize/0302d07e10ba8dc211f7b4e25891ad46dda31976/hub/2023/02/05/f52fdc98-dafc-4d05-b20e-8bd936b49a53/oneplus-11-review-cnet-lanxon-promo-8.jpg?auto=webp&fit=crop&height=675&width=1200',
        name : 'Iphone 15',
        characteristics : ['Sms routing', '3G internt', 'Device']
    }
    
    res.status(200).json({device})
    
}

module.exports = { LeaveRequest, LeaveRequestForSearch, CreateOrder, TestForm, TestDataBase }