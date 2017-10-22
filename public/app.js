$(document).ready(function(){
    $(".saved-articles").hide();

    $("#scrape").on("click", function(event){
        console.log("clicked!");
        alert("Scrape Complete!")
        $.getJSON("/articles", function(data){
            for (var i = 0; i < data.length; i++){
                $(".results").append('<div class = "card"><div class="card-body">' + data[i].title + '<input class="btn" type="button" id="save" value="Save Article">' + '<br>' + data[i].summary + '</div></div><br>')
            }
        })
    })

    $("#save").on("click", function(event){
        event.preventDefault();

    })
})