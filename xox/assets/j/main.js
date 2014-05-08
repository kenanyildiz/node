XOX = {

    me: null,

    playRank: "x",

    count: 0,

    flagCount: 0,

    noWinCount: 0,

    playCount: 0,

    socketVar: io.connect('http://localhost:3000'),

    winArr: [],

    timeFinishRivalWinCount: 0,

    init: function(){

        XOX.widthHeightCalc();

        $(window).on('resize',XOX.widthHeightCalc);

        $('.item').on('click',XOX.choose);

    },

    popup: {

        init: function(){
            $('.pp-btn').on('click',XOX.popup.open);
            $('.close-btn').on('click',XOX.popup.close);
        },

        open: function(){
            XOX.popup.close();
            $('.item').addClass('selected');
            $('.popup[data-name="'+$(this).attr('data-id')+'"]').removeClass('hidden');
        },

        close: function(){
            $('.item').removeClass('selected');
            $('.popup').addClass('hidden');
        }

    },

    countdown: {

        value: 6,

        interval: null,

        flag: 0,

        init: function(){

            if ( XOX.countdown.flag ) {

                XOX.countdown.interval = setInterval(function(){

                    XOX.countdown.value--;

                    if ( XOX.countdown.value >= 0 && !$('.countdown').hasClass('stop') ) {

                        if ( XOX.countdown.value != 0 ){

                            $('.countdown span').html(XOX.countdown.value);

                        } else if ( XOX.countdown.value == 0 ) {

                            $('.countdown span').html(XOX.countdown.value);

                            clearInterval(XOX.countdown.interval);

                            XOX.socketVar.emit('play time finished',XOX.playRank);

                        }

                    }

                },1000);

            }

        }

    },

    widthHeightCalc: function(){
        var winWidth    = $(window).width(),
            winHeight   = $(window).height(),
            itemWidth   = ((winWidth-12)/3),
            itemHeight  = ((winHeight-12)/3);
        $('.item').width(itemWidth).height(itemHeight).css('line-height',itemHeight+'px');
    },

    chooseTeam: {

        init: function(){
            $('.choose-team a').on('click',XOX.chooseTeam.choose);
            $('.choose-team .play-btn').on('click',XOX.chooseTeam.play);
        },

        choose: function(){
            $(this).siblings('a').removeClass('selected');
            $(this).addClass('selected');
            return false;
        },

        play: function(){
            var selected = jQuery.trim($(this).siblings('a.selected').attr('data-team'));
            if ( selected.length ) {
                $('.close-btn').trigger('click');
                XOX.socketVar.emit('new user', selected, function(data){
                    if (data){
                        //console.log(data);
                    } else {
                        $('.reserved-team.pp-btn').trigger('click');
                    }
                });
            }
        }
    },

    choose: function(){

        if( XOX.playRank != XOX.me )
            return false;

        var th = $(this);

        if( th.hasClass('selected') || $('.item').hasClass('win') )
            return false;

        if ( th.text().length )
            console.log('ben bir');

        XOX.count++;

        XOX.socketVar.emit('my data', XOX.me+'-'+th.attr('data-location'));

        XOX.socketVar.emit('play rank', XOX.me);

    },

    controlMechanism: function(location){

        //console.log(winArr[0].match(id));

        if(XOX.count >= 3){

            for(var i = 0; i < XOX.winArr.length; i++){

                if(XOX.winArr[i].match(location) > -1){

                    var flag = true;
                    var grid = XOX.winArr[i].split('');

                    for(var j = 0; j < grid.length; j++){
                        if ( $('.item[data-location="'+grid[j]+'"]').attr('data-person') != XOX.me ){
                            flag = false;
                        }
                    }

                    if(flag) {
                        XOX.noWinCount = 1;
                        var winData = grid[0]+'-'+grid[1]+'-'+grid[2]+'-'+XOX.me;
                        XOX.socketVar.emit('win data',winData);
                        break;
                    }

                }
                if(flag) break;
            }

            // Hepsini doldurduklarındaki kazanamama durumu!
            if ( XOX.playCount == 9 && XOX.noWinCount == 0 ){
                alert('Kazanamadık!');
                XOX.socketVar.emit('no winners');
            }

        }
    },

    clear: function(clearClass,closePopup){
        //clearClass = clearClass || false;
        if (clearClass != undefined){
            $('.item').removeClass('selected x o win').attr('data-person','').html('');
        }
        if (closePopup != undefined){
            XOX.popup.close();
        }
        XOX.count = 0;
        XOX.noWinCount = 0;
        clearInterval(XOX.countdown.interval);
        XOX.countdown.flag = 1;
        XOX.countdown.value = 6;
        XOX.countdown.init();

    },

    clearCountdown: function(){
        XOX.noWinCount = 0;
        clearInterval(XOX.countdown.interval);
        XOX.countdown.flag = 1;
        XOX.countdown.value = 6;
        XOX.countdown.init();
    }

};

$(document).ready(function(){

    XOX.popup.init();

    XOX.chooseTeam.init();

    var con = io.connect('http://localhost:3000');

    con.on('thirdPlayer', function(){
        alert('Room is full!');
        location.href = 'http://senGelmeLanAyı';
    });

    con.on("js init", function(winArr) {
        XOX.init();
        XOX.winArr = winArr;
        $('.item').removeClass('selected');
        XOX.popup.close();
    });

    con.on('call nick', function(data){
        XOX.me = data;
    });

    con.on('call play rank', function(data){
        XOX.playRank = data;
        $('.countdown').removeClass('x o').addClass(XOX.playRank);
    });

    con.on('countdown init', function(){
        XOX.clearCountdown();
    });

    con.on('call my data', function(result){

        var data = result.split('-');

        XOX.playCount = data[2];

        $('.item[data-location="'+data[1]+'"]').html(data[0]).addClass('selected '+ data[0]).attr('data-person',data[0]);

        XOX.controlMechanism(data[1]);

    });

    con.on('call win data', function(data){

        var winData = data.split('-');

        $('.item[data-location="'+winData[0]+'"]').addClass('win');
        $('.item[data-location="'+winData[1]+'"]').addClass('win');
        $('.item[data-location="'+winData[2]+'"]').addClass('win');

        var kazanan;
        if ( winData[3] == XOX.me ){
            kazanan = 'siz kazandınız';
        } else {
            kazanan == 'rakibiniz kazandı';
        }

        var text = 'Oyunu '+ kazanan +', tekrar oynamak için tamam tuşuna tıklayınız.!';

        $('.popup.win p').html(text);
        $('.win.pp-btn').trigger('click');

        $('.countdown').addClass('stop');

        var a = true;
        $('.win.popup .ok').click(function(){
            if ( a ) {
                XOX.socketVar.emit('selected');
                a = false;
            }
        });

    });

    con.on('call play time finished', function(data){

        if ( XOX.me == XOX.playRank ) {

            $('.play-time-finished.pp-btn').trigger('click');

            var c = true;
            $('.play-time-finished .ok').click(function(){
                if ( c ) {
                    XOX.socketVar.emit('sureBittiRakipKazandiRestart');
                    c = false;
                }
            });

        } else {

            $('.your-win.pp-btn').trigger('click');
            var z = true;
            $('.your-win .ok').click(function(){
                if ( z ) {
                    XOX.socketVar.emit('sureBittiRakipKazandiRestart');
                    z = false;
                }
            });

        }

    });

    con.on('call no winners', function(){
        $('.no-winners.pp-btn').trigger('click');
        $('.no-winners .ok').click(function(){
            XOX.clear(true,true);
            XOX.socketVar.emit('clear player data');
        });
    });

    con.on('playerDown', function(){
        $('.rival-left-game.pp-btn').trigger('click');

    });

    con.on('call clear player data', function(){
        $('.countdown').removeClass('stop');
        XOX.clear(true,true);
        XOX.clearCountdown();
    });

    con.on('call selected class', function(data){
        $('.item').addClass('selected');
    });

    con.on('call sbrkr', function(data){
        $('.item').addClass('selected');
    });

    $('.popup .ok').on('click', function(){

        // Start Game!
        if ( XOX.me != null ) {
            XOX.popup.close();
        }

        // Return choose team popup.
        if ( $(this).parent('.rival-left-game.popup').length ) {
//            $('.rival-left-game.popup').addClass('hidden');

            XOX.popup.close();
            XOX.clear(true,true);

            XOX.socketVar.emit('restart');

        }

        // Return choose team popup.
        if ( $(this).parent('.reserved-team.popup').length ) {
            $('.reserved-team.popup').addClass('hidden');
            $('.choose-team').removeClass('hidden');
        }

    });

    con.on('call restart', function(){
        restart();
    });

    con.on('noRestartTeam', function(){
        XOX.me = 'x';
    });

    /* En Başa Al */
    function restart(){
        XOX.me = null;
        XOX.count = 0;
        XOX.noWinCount = 0;
        XOX.countdown.flag = 1;
        XOX.countdown.value = 6;
        $('.item').addClass('selected');
        XOX.clearCountdown();
        clearInterval(XOX.countdown.interval);
        $('.countdown').addClass('stop');
        $('.choose-team').removeClass('hidden');
    }



});