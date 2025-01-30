const axios = require('axios')
const dotenv = require('dotenv');
dotenv.config()

const GetCities = async function (req, res, next) {
  try {
    const options = {
      method: 'POST',
      url: 'https://api.novaposhta.ua/v2.0/json/',
      data: {
        apiKey: process.env.NOVA_POSHTA_KEY,
        modelName: 'Address',
        calledMethod: 'searchSettlements',
        methodProperties: {
          CityName: req.query.city,
        },
      },
      headers: { 'Content-Type': 'application/json' },
    }

    axios.request(options).then(response => {
      const arr = response.data.data[0].Addresses.map(city => ({
          city : city.Present,
          id : city.DeliveryCity
      }))
      res.status(200).json(arr)
    })
  } catch (error) {
    res.status(500).json(error)
  }
}

const GetDepartments = async function (req, res, next) {
  try {

    const options = {
      method: 'POST',
      url: 'https://api.novaposhta.ua/v2.0/json/',
      data: {
        apiKey: process.env.NOVA_POSHTA_KEY,
        modelName: 'Address',
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: req.query.cityref,
        },
      },
      headers: { 'Content-Type': 'application/json' },
    }

    axios.request(options).then(response => {
      const arr = response.data.data.map( department => ({
          department : department.Description
      }))
      res.status(200).json(arr)
    })
  } catch (error) {
    res.status(500).json(error)
  }
}

module.exports = { GetCities, GetDepartments }