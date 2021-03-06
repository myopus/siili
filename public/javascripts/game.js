$(function() {
  siili.build_board = function(data, element) {
    var class_name_for_value = function(value) {
      switch(value) {
        case 0:
          return 'empty'; break
        case 1:
          return 'white'; break
        case 2:
          return 'black'; break
      }    
    }
    
    element.html('')
    for(var row in data) {
      if(row.match(/\d+/)) {
        for(col in data[row]) {
          if(col.match(/\d+/)) {
            var id = row + '_' + col
            var class_name = class_name_for_value(data[row][col])
            element.append('<div class="field ' + class_name + '" id="' + id + '"></div>')
          }
        }
      }
    }
  }
  
  var set_info = function(game) {
    var show_players = function(game) {
      $('#info').html('<h2>Players</h2><ul class="players"><li>' + game.white +
        ',<br />Prisoners: ' + game.prisoners_of_white + '</li></ul>')
      if(game.black)
        $('#info .players').append('<li>' + game.black + ',<br />Prisoners: ' + game.prisoners_of_black + '</li>')      
    }
    
    var show_resigned_by = function(game) {
      if(game.resigned_by) {
        $('#info').append('<p class="resigned">' +
         ((game.resigned_by.user === siili.current_user()) ? 'You' : game.resigned_by.color) +
        ' resigned.</p>')
      }      
    }
    
    show_players(game)
    show_resigned_by(game)
    $('#info').show()
  }
  
  var display_game = function(game, index) {
    function minimize(maximized, index, callback) {
      if(callback) { callback() }

      maximized.
        removeClass('playable').
        css({
          '-webkit-transform': 'scale(0.2) translateX(0px) translateY(0px)',
          '-moz-transform': 'scale(0.2) translateX(0px) translateY(0px)',
          '-o-transform': 'scale(0.2) translateX(0px) translateY(0px)',
          'transform': 'scale(0.2) translateX(0px) translateY(0px)'
        })
    }
    
    function maximize(game, index, callback) {
      callback = callback || function() {}
      var $game = $('div.game[data-identifier=\'' + game._id + '\']'),
        translateY = 180 - ((index % 5) * 100) + 'px',
        translateX = -350 -(Math.floor(index/5) * 100) + 'px'
      
      $game.
        addClass('playable').
        one('webkitTransitionEnd transitionend oTransitionEnd', callback).
        css({
          '-webkit-transform': 'scale(1) translateX(' + translateX + ') translateY(' + translateY + ')',
          '-moz-transform': 'scale(1) translateX(' + translateX + ') translateY(' + translateY + ')',
          '-o-transform': 'scale(1) translateX(' + translateX + ') translateY(' + translateY + ')',
          'transform': 'scale(1) translateX(' + translateX + ') translateY(' + translateY + ')'
        })
        
      setTimeout(callback, 500)
    }
    
    function show_links(game) {
      if(game.active) { $('#game_links').show() }
    }
    
    var maximized = $('div.game.playable')
    if(maximized.length > 0) {
      minimize(maximized, index, function() {
        $('#game_links').hide()
        $('#info').hide()
      })
    }
    maximize(game, index, function() {
      show_links(game)
      set_info(game)
    })
  }
  
  $('.new_game').click(function() {
    siili.post('/games', {board_size: 9}, function(game) {
      siili.display_games(function() {
        display_game(game, $('div.game').length - 1)
      })
    }, siili.flash_error)
    return false
  })
  
  $('a.join_game').live('click', function() {
    $.facebox($('#join').html())
    return false
  })
  
  $('input.join_game').live('click', function() {
    var game_id = $('#facebox .game_id').val()
    siili.put('/games/' + game_id, {action: 'join'}, function(game) {
      $(document).trigger('close.facebox')
      siili.display_games(function() {
        display_game(game, $('div.game').length - 1)
      })
    }, function(error) {
      $('#facebox form').append('<div class="error">' + error.responseText + '</div>')
    })
    return false
  })
  
  $('div.game:not(.playable) a').live('click', function() {
    var game_div = $(this).parents('div.game')
    display_game(JSON.parse(game_div.attr('data-game').replace(/'/g, '"')), game_div.attr('data-index'))
    return false
  })
  
  $('.active.playable:not(.resigned) .field.empty').live('click', function(evt) {
    var id = $(this).attr('id').split('_'),
      params = { x: id[0], y: id[1], game: $('.game.playable').attr('data-identifier') }
    
    siili.post('/stones', params, function(game) {
      var game_div = $('.game.playable')
      game_div.removeClass('active')
      game_div.find('.board').html('')
      siili.build_board(game.board, game_div.find('.board'))
    }, siili.flash_error)
  })
  
  $('#game_links .resign').live('click', function() {
    var id = $('.playable').attr('data-identifier')
    
    siili.put('/games/' + id, { action: 'resign' }, function(game) {
      $('#info').append('<p>You resigned.</p>')
      $('.playable').addClass('resigned')
      siili.update_game_div_data_attributes(id, game)
    }, siili.flash_error)
    return false
  })
})