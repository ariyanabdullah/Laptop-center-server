const express = require('express')
require('dotenv').config()
var jwt = require('jsonwebtoken')
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express()
port = process.env.PORT || 5000



app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_PASSWORD}@cluster0.lcft2gb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// ===verify Token====
function verifyJET(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).send('unauthorize access')
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      res.status(403).send({ message: 'forbiden access' })
    }
    req.decoded = decoded
    next()
  })
}



// ===user verify===
const verifyUser = async (req, res, next) => {
  const decodeEmail = req.decoded.email;
  const filter = { email: decodeEmail };
  const user = await userCollection.findOne(filter);

  if (user.role !== "User") {
    return res.status(403).send({ message: "Forbidden Access" });
  }
  next();
};


// === Seller Verify ===
const verifySeller = async (req, res, next) => {
  const decodeEmail = req.decoded.email;
  const filter = { email: decodeEmail };
  const user = await userCollection.findOne(filter);

  if (user.role !== "Seller") {
    return res.status(403).send({ message: "Forbidden Access" });
  }
  next();
};


// == Verify Admin===

const verifyAdmin = async (req, res, next) => {
  const decodeEmail = req.decoded.email;
  const filter = { email: decodeEmail };
  const user = await userCollection.findOne(filter);

  if (user.role !== "Admin") {
    return res.status(403).send({ message: "Forbidden Access" });
  }
  next();
};




async function run(){


  try{


    // ==data collection===
    const categoryCollection = client.db('resellLeptop').collection('category')
    const userCollection = client.db('resellLeptop').collection('alluser')
    const productCollection = client.db('resellLeptop').collection('allProduct')
    const advertisedCollection = client.db('resellLeptop').collection('advertised')
    const orderCollection = client.db('resellLeptop').collection('orders')
    const paymentCollection = client.db('resellLeptop').collection('payment')






    // ====jwt Token provider====

     app.get('/jwt', async (req, res) => {
      const email = req.query.email
      console.log(email)
      const query = { email: email }
      const user = await userCollection.findOne(query)
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: '1h',
        })
        return res.send({ accessToken: token })
      }
      res.status(401).send('Unauthorize access')
    })


     
    app.get('/',  async(req, res) =>{
        res.send ('Leptop center server is runniung')
    })
    

    // ===Get All categeory
    app.get('/categories', async(req, res) =>{
        const query ={}
        const result = await categoryCollection.find(query).toArray()
        res.send(result)
    })



    // ==create user
    app.post('/alluser', async(req, res) =>{
        const query = req.body
        const user = await userCollection.insertOne(query)
        res.send(user)
    })


    // ==check role
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });




    // ==User order Collection
    app.post('/orders', async (req, res) =>{
      const order = req.body
      const result = await orderCollection.insertOne(order)
      res.send(result)
    })
   

    // ===get user orders
    app.get('/allorder', async (req, res) =>{
      const email = req.query.email;
      const query = {email : email}
      const result = await orderCollection.find(query).toArray()
      res.send(result)
    })


    // == delete User Orders
    app.delete('/deleteBookingProduct/:id', async(req, res) =>{
      const id = req.params.id
      const query = {_id: ObjectId(id)}
      const result = await orderCollection.deleteOne(query)
      res.send(result)
    })


    // get category in category field
    app.get('/categoryname', async (req, res) =>{
      const query= {}
      const result =await categoryCollection.find(query).project({ 
        category_name: 1 }).toArray()
      res.send(result)
    })


    // ===Add product in product collection
    app.post('/addproduct', async (req, res) =>{
      const product = req.body;
      const result = await productCollection.insertOne(product)
      res.send(result)
    })




    // ==get product for seller component
     app.get('/allproduct', async (req, res) =>{
       const email = req.query.email
       const query = {email : email}
       const result = await productCollection.find(query).toArray()
       res.send(result)
     })

   


    // ==get data
    app.get('/allseller', async (req, res)=>{
         const role = req.query.role
         const query = {role : role}
         const result = await userCollection.find(query).toArray()
         res.send(result)
    })


  //  ===updet add item
    app.patch('/advertise/:id', async(req, res) =>{
       const id = req.params.id
       const filter = {_id: ObjectId(id)}
       const options = {upsert : true}
       const updateDoc = {
        $set:{
          isAdvertise: "true",
        }
       }
       const result = await productCollection.updateOne(filter, updateDoc, options)
       res.send(result)
    })
    




    // ==get advertise for home page
    app.get('/advertise', async(req, res) =>{
      const advertise = req.query.isAdvertise
      const query = {isAdvertise: advertise}
      const result = await productCollection.find(query).toArray()
      res.send(result)
      console.log(result)
    })


    // ===delete user
    app.delete('/userdelete/:id', async (req, res) =>{
      const id = req.params.id
      const query = {_id: ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })



    //====updet user
    app.put('/updetuser/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: ObjectId(id) }
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          status: 'Verifyed',
        },
      }
      const result = await userCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    })





    // =====get product depend on categories id
    app.get('/category_product/:id', async (req, res) =>{
      const id = req.params.id
      const query = {category_id: id}
      const result = await productCollection.find(query).toArray()
      res.send(result)
    })


    // =====get user data
    app.get('/seller/:email', async (req, res)=>{
      const email = req.params.email
      const query = {email : email}
      const result = await userCollection.findOne(query)
      res.send(result)
 })


 
//  //   ===delete advertise product data
   app.delete('/productdelete', async (req, res) =>{
     const name = req.query.name
     const query = {ProductName : name}
     const result = await productCollection.deleteOne(query)
      res.send(result)
   })




 app.post('/advertised', async (req, res) =>{
  const advertised = req.body;
  const result = await advertisedCollection.insertOne(advertised)
  res.send(result)
})


app.get('/showadvertised', async (req, res) =>{
  const query= {}
  const result =await advertisedCollection.find(query).toArray()
  res.send(result)
})



// ==updet report===
app.patch('/setreport/:id', async(req, res) =>{
  const id = req.params.id;
  const filter = {_id: ObjectId(id)}
  const options = {upsert : true}
  const updateDoc={
    $set:{
      report : "true"
    },
  }
  const result = await productCollection.updateOne(filter, updateDoc, options)
  res.send(result)

})


// === get reported item =
app.get('/reporteditem', async(req, res) =>{
   const report = req.query.report
   const filter = {report : report}
   const result = await productCollection.find(filter).toArray()
   res.send(result)
})





// === sellerInfo ===
app.get('/seller/:email', async (req, res) =>{
  const email = req.params.email
  const query = {email: email}
  console.log(query);
  const result = await userCollection.find(query).toArray()
  res.send(result)
})


// === delete product by axious
app.delete('/deletereporteditem/:id', async (req, res) =>{
   const id = req.params.id;
   const query = {_id: ObjectId(id)}
   const result = await productCollection.deleteOne(query)
   res.send(result)
})





    // get user order for payment depend on specafic id 
    app.get('/orderpayment/:id', async (req, res) =>{
      const id = req.params.id
      const query = {_id: ObjectId(id)}
      const result = await orderCollection.findOne(query)
       res.send(result)
      
    })





 // ====payment client secret===
  app.post('/create-payment-intent', async (req, res) => {
    const price = req.body.productPrice
    const amount = price * 10
    const paymentIntent = await stripe.paymentIntents.create({
      currency: 'usd',
      amount: amount,
      "payment_method_types": ["card"],
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    })
    
  })


// ====payment post===
 app.post('/payments', async(req, res) =>{
   const payment = req.body
   const result = await paymentCollection.insertOne(payment)

  // agreegat
  // updet product collection
    const id = payment.bookingId
    const filter = {_id: ObjectId(id)}

    const updateDoc = {
    $set: {
      paid: true,
      transactionId: payment.transactionId
    }
  }

    
  const updateResult = await productCollection.updateOne(filter, updateDoc)

  // updet order collection
  const orderId = payment.bookingId
  const query = {producId: orderId}
  const updetDocs = {
    $set:{
      paid : true,
      transactionId: payment.transactionId
    }
  }
  const updateOrder = await orderCollection.updateOne(query, updetDocs)

  res.send(result)
})




  }
  finally{

  }




}
run()
.catch(err => {
    console.log(err);
})


app.listen(port, () => {
  console.log('Leptop center server is runniung')
})
