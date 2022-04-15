const express =  require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser');
const weaviate = require("weaviate-client");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'views')));
app.engine('html', require('ejs').renderFile);
let initial_path = path.join(__dirname, "views");

//setting up client
const client = weaviate.client({
    scheme: 'https',
    host: 'npfbcbjoevfnpuoe.semi.network'
  });

// Creating Schema
var text_class_schema = {
    "class": "Text",
    "description": "Text that the user has given as input",
    "properties": [
        {
            "name": "data",
            "dataType": ["string"],
            "description": "The data of the textbox", 
        }
    ]
}




app.get('/', (req, res) => {
    
    //Deleting Schema if already exists
    client.schema
    .classDeleter()
    .withClassName('Text')
    .do()
    .then(info => {
    console.log(info);
        client.schema
        .classCreator()
        .withClass(text_class_schema)
        .do()
        .then(info => {
        console.log(info)
        res.render(path.join(initial_path, "add_data.html"));
        })
        .catch(err => {
        console.error(err)
        });
    })
    .catch(err => {
    console.error(err)
    });


    
})

app.post('/query', (req, res) => {
    let text = req.body.data;
    console.log(text);

    //Adding data that is provided
    client.data
        .creator()
        .withClassName('Text')
        .withProperties({
            "data": text
        })
        .do()
        .then(info => {
            console.log(info)
            res.render(path.join(initial_path, "search.ejs"),{answer:{}});
        })
        .catch(err => {
            console.error(err)
        });
})
app.post('/search', (req, res) => {
    let searched_data = req.body['searched_data'];
    console.log(searched_data)

    //Searching for answer
    client.graphql
    .get()
    .withClassName('Text')
    .withAsk({
      question: searched_data,
      properties: ["data"],
    })
    .withFields('data _additional { answer { hasAnswer certainty property result startPosition endPosition } }')
    .withLimit(1)
    .do()
    .then(info => {
      console.log(info['data']['Get']['Text'][0]['_additional']['answer']['result'])
      res.render(path.join(initial_path, "search.ejs"),{answer:info['data']['Get']['Text'][0]['_additional']['answer']['result']});
    })
    .catch(err => {
      console.error(err)
    });
})


app.listen(process.env.PORT || 3000)

      