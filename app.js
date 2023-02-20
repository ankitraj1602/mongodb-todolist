const express = require("express");
const bodyParser = require("body-parser");
const app = new express();
const dates = require(__dirname + "/date.js"); // importing to use the module
const mongoose = require("mongoose");
const _ = require("lodash");

app.use(express.static("public")); // move the static files to the public folder
app.use(bodyParser.urlencoded({extended:true})); // to get form values
app.set('view engine', 'ejs'); // use ejs as view engine , to render html
app.listen(3000,function(){
    console.log("Server Connected");
});


//connect to mongodb
mongoose.set("strictQuery", false);
//mongoose.connect("mongodb://127.0.0.1:27017/todolistdb"); to connect to local db
// when we want to connect to cloud atlas database storage , we just need to change one thing, the url is below
//mongodb+srv://admin_ankit:<password>@cluster0.3vhjems.mongodb.net/?retryWrites=true&w=majority
mongoose.connect("mongodb+srv://admin_ankit:yG903rAu@cluster0.3vhjems.mongodb.net/todolistdb"); // voila, we have connected to cloud



// create a mongoose schema and model
const itemSchema = new mongoose.Schema({
    name : {type : String, required : [true ,"List cannot be entered without name"]}
});



// for a custom route , we create a custom schema
// there will be a field of name and items
// the name will correspond to a particular collection, depending on the custom route of the user
// the items will be array of documents matching the schema of itemSchema
// the new items in a particular name field will be added in the items field of the customLists collection
// therefore, the list schema is part of the customLists collection
const listSchema = new mongoose.Schema({
    name : {type : String, required : [true ,"Collection cannot be entered without name"]},
    items : [itemSchema]
});
const List = mongoose.model("customList",listSchema);




const Item = mongoose.model("item",itemSchema);
// make three random starting items
const i1 = new Item({
    name : "Welocme, add items todo list."
});

const i2 = new Item({
    name : "Hit + to add a new item."
});

const i3 = new Item({
    name : "Hit <-- to delete a item."
});


var itemList = [i1,i2,i3]; 
// lets find the first three items and use it to populate the view.

const rootLabel = dates.getDay(); // the label used in the root route to do list


app.get("/",function(req,res){
    //day = dates.getDate(); // call the binded function to the object, the function was bind in the date.js file
    day = dates.getDay(); // just gets the day
    console.log("Root label is " + rootLabel);
    // when the route loads, we check for the items in mongo db and populate the ejs templates
    Item.find(function(err,items){
        if(err){
            console.log(err);
        }
        else{

            // when the items is an empty array then, insert the random items to the database and redirect again to same route.
            // this will populate the form with existing first 3 items.
            if(items.length === 0){
                Item.insertMany(itemList,function(err){
                    if(err){
                        console.log(err);
                    }
                    else{
                        console.log("Succesfully added the default items, redirecting to home route");
                        res.redirect("/");
                    }
                });
            }
            else{
                res.render("list",{ listtype : day, items : items});
            }
        }
    });
});

app.post("/add",function(req,res){
    //console.log(req.body);
    var itemName = req.body.newitem;
    var newItem = new Item({
        name : itemName
    });

    var listType = req.body.button;
    if(listType === "Saturday"){ // the add operation performed in root label , so add item to items collection
        newItem.save();
        res.redirect("/");
    }

    // we need to find the custom list and add the append the new item to the items document (i.e listSchema)
    else{
        List.findOne({name : listType},function(err,foundDoc){
            if(err){
                console.log(err);
            }
            else{
                foundDoc.items.push(newItem);
                foundDoc.save(); // save works because here the foundDoc is a document
                res.redirect("/" + listType);
            }
        });
    }
    
});


app.post("/delete",function(req,res){
    var val = req.body.checkBox;
    var listtype = req.body.hiddenList;

    console.log("Checkboc is checked" + val);
    if(listtype === rootLabel){  // this means deleting item is taking place from the root route
        Item.findByIdAndRemove(val,function (err) {
            if(err){
                console.log("Unsuccessful delete");
            }
            else{
                console.log("Successful delete");
            }
            res.redirect("/");
        });
    }

    else{  // we need to find the custom list and delete the referenced item
        // we need to find the document in the customLists collection
        // then from that document's item's , we need to delete the concerned item from the array
       List.findOneAndUpdate({name : listtype},
                            { $pull: {items: {_id : val}}},function(err,results){
            if(err){
                console.log(err);
            }
            else{
                res.redirect("/" + listtype);
            }
        });

    }
    
});


// custom routing
app.get("/:customListName",function(req,res){

    // using lodash always capitalize the routes, first letter big, rest are small

    var clName = _.capitalize(req.params.customListName); // this will be the collection name
    console.log(clName);

    

    // if the customList model does not have a document with customList Name then populate with random list items
    List.findOne({name:clName},function(err,foundDoc){
        if(err){
            console.log(err);
        }
        else{
            if(foundDoc != null || foundDoc != undefined){
                console.log("The doc exists");
                // render the document with its views
                res.render("list",{ listtype : foundDoc.name, items : foundDoc.items});
            }
            
            else{
                // populate with the default items
                const list = new List({
                name : clName,
                items : itemList
                });
                list.save();
                res.redirect("/" + clName);
            }
        }
    });  
});