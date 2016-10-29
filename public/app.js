// initial call to get json from the articles route to populate articles element with scrapped articles
// stored in mongodb
$.getJSON('/articles', function(data)
{
    //creates a link to scrape in case database is empty
    if(data.length == 0)
    {
        var initialLink = $('<a>').attr('href', '/scrape').text('SCRAPE TIME then press back...');
        $('#articles').append(initialLink);
    }
    for (var i = 0; i<data.length; i++)
    {
        $('#articles').append('<p data-id="' + data[i]._id + '">'+ data[i].title + '<br />'+ data[i].link + '</p>');
    }
});

// logic for clicking on a paragraph element to show note title and body
// populates note title and body if article has a note that was retrieved from mongodb
$(document).on('click', 'p', function()
{
    // empties note element to be able to refresh it
    $('#notes').empty();
    //retrieves id of article
    var thisId = $(this).attr('data-id');

    // ajax call to get article and article note info
    $.ajax(
    {
        method: "GET",
        url: "/articles/" + thisId,
    })
    .done(function(data)
    {
        console.log(data);
        $('#notes').append('<h2>' + data.title + '</h2>');
        $('#notes').append('<input id="titleinput" name="title" >');
        $('#notes').append('<textarea id="bodyinput" name="body"></textarea>');
        $('#notes').append('<button data-id="' + data._id + '" id="savenote">Save Note</button>');

        //if article has a note, populate the value of the input title and textarea body with what was stored in mongodb
        if(data.note)
        {
            $('#titleinput').val(data.note.title);
            $('#bodyinput').val(data.note.body);
        }
    });
});

// logic to post note data to mongodb
$(document).on('click', '#savenote', function()
{
    // article id
    var thisId = $(this).attr('data-id');

    // ajax post to store article note data with specified article id
    $.ajax(
    {
        method: "POST",
        url: "/articles/" + thisId,
        data:
        {
            title: $('#titleinput').val(),
            body: $('#bodyinput').val()
        }
    })
    // once it's been posted, removes note form and empties field values so they won't still display data
    // incase the next article pressed does not contain any data in the note
    .done(function(data)
    {
        console.log(data);
        $('#notes').empty();
    });

    $('#titleinput').val("");
    $('#bodyinput').val("");
});