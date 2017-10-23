$(document).ready(function(){

    $("#scrape").on("click", function(event){
        console.log("clicked!");
        alert("Scrape Complete!")
        $.getJSON("/articles", function(data){
            for (var i = 0; i < data.length; i++){
                $(".results").append('<form action="/save" method="POST"><div class = "card"><div class="card-body">' + data[i].title + '<button type="button" class="btn saved">Save Article</button>' + '<br>' + data[i].summary + '</div></div><br>')
            }
            $(".saved").on("click", function(event){
                console.log("clicked on save");
                //(".card").empty();
                $.post("/articles").done(function(data){
                    window.location.reload();
                })
            })
        })
    }) 
})