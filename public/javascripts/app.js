$( function() {
    var my_autoComplete = new autoComplete({
        selector: '#skills-field',
        source: function (term, response) {
            try {
                xhr.abort();
            } catch (e) {
            }
            $.getJSON('http://api.dataatwork.org/v1/skills/autocomplete',
                {begins_with: term},
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
});
