const mongoose = require('mongoose');
const path = require('path');
const Campground = require('../models/campground');
const express = require('express');
const cities = require('./cities');
const {
  places,
  descriptors
} = require('./seedHelpers');

const app = express();

main().catch(err => console.log('OH NO, ERROR', err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/yelp-camp');
  console.log('MONGO Connection Open!');
}

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDb = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 300; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      //YOUR USER ID
      author: '63c88c736ca7c1c0197f126c',
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Facilis eligendi quis assumenda officiis reiciendis saepe fuga, rem soluta ducimus est! Numquam cupiditate officiis laudantium impedit accusantium molestias commodi doloribus. Totam!',
      price,
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ]
      },
      images: [{
          url: 'https://res.cloudinary.com/drytjdqfm/image/upload/v1676927237/YelpCamp/gamov5feauwzk06yt7z7.jpg',
          filename: 'YelpCamp/gamov5feauwzk06yt7z7',
        },
        {
           url: 'https://res.cloudinary.com/drytjdqfm/image/upload/v1681493668/YelpCamp/toleuqti7bmt87nbvz7d.jpg',
          filename: 'YelpCamp/toleuqti7bmt87nbvz7d',
        }
      ]
    });
    await camp.save();
  }
}

seedDb().then(() => {
  mongoose.connection.close();
})