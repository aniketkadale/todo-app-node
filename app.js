//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://admin-anil:Test123@cluster0.ncz1xj1.mongodb.net/todoDB",
  { useNewUrlParser: true }
);


const itemSchema = mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);


const item1 = new Item({
  name: "Default task 1"
});

const item2 = new Item({
  name: "Default task 2",
});

const item3 = new Item({
  name: "Default task 3",
});


const defaultArray = [item1, item2, item3];


const ListSchema = mongoose.Schema({
  name: String, 
  items: [itemSchema]
});

const List = mongoose.model("List", ListSchema);



// Read the documents in the item collection
Item.find()
  .then(function (items) {
    items.forEach(function (item) {
      console.log(item.name);
    });
  })
  .catch(function (err) {
    console.log(err);
  });



app.get("/", function(req, res) {
  Item.find().then(
    function(foundItems) {
      if(foundItems.length === 0) {
        // Insert the documents in the item collection
        Item.insertMany(defaultArray)
          .then(function () {
            console.log("Successfully inserted the items array..");
          })
          .catch(function (err) {
            console.log(err);
          });

          res.redirect('/');
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    }
  )
});


// Creaing custom dynamic routes using express

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultArray,
      });

      await list.save();
      res.redirect("/" + customListName);
    } else {
      // console.log(customListName + " already exists, Redirecting.....")
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  } catch (err) {
    console.error("Error while checking for existing list or saving:", err);
  }
});











app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if(listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    try {
     List.findOne({name: listName}).then(
      function(foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
     )

    } 
    
    catch(err) {
      console.log(err);
    }
  }

  


});


// Delete a task

app.post("/delete", function(req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItem)
      .then(function () {
        console.log("Successfully deleted checked item from root directory!");
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}).then(
      function() {
        res.redirect("/" + listName);
      }
    ).catch(function(err) {
      console.log(err);
    })
  }

    
})




app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
