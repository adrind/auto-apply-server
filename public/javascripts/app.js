$( function() {
    var my_autoComplete = new autoComplete({
        selector: '#skills-field',
        source: function (term, response) {
            //prevents too many requests from being made
            try {xhr.abort();} catch (e) {}
            $.getJSON('http://api.dataatwork.org/v1/skills/autocomplete',
                {
                    begins_with: term //open skills api query param
                },
                function (data) {
                    var results = data.map(function (datum) {
                        return {value: datum.suggestion, id: datum.uuid};
                    });

                    response(results);
                }
            );
        },
        renderItem: function (item, search) {
            return '<div class="autocomplete-suggestion" data-value="'+item.value+'" data-id=' + item.id + '>' + item.value + '</div>';
        },
        onSelect: function (e, term, item) {
            $('#log').append('<span class="badge badge-success" data-id=' + item.dataset['id'] + '>' + item.dataset['value'] + '</span>')
        }
    });

    var makeRequest = function (url, formId) {
        return $.post(url, $(formId).serialize());
    };
    
    $('#add-education-btn').click(function (evt) {
        makeRequest('http://localhost:3000/addEducation', '#add-education-form').done(function () {
            console.log('success')
        })
    });

    $('#add-contact-btn').click(function (evt) {
        makeRequest('http://localhost:3000/addContact', '#add-contact-form').done(function () {
            console.log('success')
        })
    });

});
