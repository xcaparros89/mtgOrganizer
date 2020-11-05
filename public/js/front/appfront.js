$(document).ready(function() {

    /////////////////////////////////////
    //        CAROUSEL SWIPE           //
    /////////////////////////////////////   
    $("#dragonic-carousel").swiperight(function() {
    $(this).carousel('prev');
    });
    $("#dragonic-carousel").swipeleft(function() {
    $(this).carousel('next');
    });

    //////////////////////////////////////
    //          SNIPPETS                //
    //////////////////////////////////////
    $(function() {
    $('a[href^="#"]').on('click',function (e) {
    e.preventDefault();

        var target = this.hash;
        var $target = $(target);

    $('html, body').stop().animate({
        'scrollTop': $target.offset().top
    }, 900, 'swing');
    });
    });

    /////////////////////////////////////
    //      MODAL WINDOW GALLERY       //
    /////////////////////////////////////
    $('.gallery-item').on('click', function() {
        var label = $('#myModalLabel');
        var img = $('#showcase-img');
        var price = $('#modal-price-tag');
        var body = $('#modalBody');
        var dataModel = $(this).find('img');
        var modelfeats = $('#model-feats').find('li');

        label.text('Dragonic: ' + $(this).find('.item-name-caption').text());
        price.text($(this).find('.item-price-caption').text());
        img.attr('src', dataModel.attr('src'));
    });

    $('div.thumbnail-50').on('click', function(){
        $('img.img-thumbnail').addClass('thumb-50');
        $('ul#model-feats').addClass('hide');
    });

    $('article.thumbnail-100').on('click', function(){
        $('img.img-thumbnail').removeClass('thumb-50');
        $('ul#model-feats').removeClass('hide');
    });

    /////////////////////////////////////
    //      MODAL WINDOW FEATURES      //
    /////////////////////////////////////
    $('.features-item').on('click', function() {
        var label = $('#myModalLabel');
        var img = $('#showcase-img');
        var price = $('#modal-price-tag');
        var body = $('#modalBody');
        var dataModel = $(this).find('img');
        var modelfeats = $('#model-feats').find('li');
        
        // Manage FORMS
        var addCardForm = $('#addCardForm');
        var removeCardForm = $('#removeCardForm');
        $(addCardForm).attr('action', '/search/card/'+dataModel.data('id')); //Set add to collection form action
        $(removeCardForm).attr('action', '/myCollection/modify/'+dataModel.data('id')); //Set remove to collection form action

        var buyCard = $('#buy-card');
        var inputN = $('#owned');

        inputN.attr('value', dataModel.data('count'));

        label.text(dataModel.data('name')); // Set Modal Title
       console.log('Hi, ', buyCard); 
        buyCard[0].innerHTML=`<a href="${dataModel.data('buy')}" class="buy-card" target="_blank" style="white-space:pre"><span class="ion-android-cart incIconSize"></span>  Buy this card</a>`;
        
        img.attr('src', dataModel.attr('src'));
        



        $(modelfeats[0]).text('Owned: ' + dataModel.data('count')); //Card type (There is always one)

        // Add other attributes just if they exists
        dataModel.data('power') ? $(modelfeats[1]).text('Power: ' + dataModel.data('power')) : $(modelfeats[1]).addClass('hidden');
        dataModel.data('toughness') ? $(modelfeats[2]).text('Toughness: ' + dataModel.data('toughness')) : $(modelfeats[2]).addClass('hidden');
        dataModel.data('setname') ? $(modelfeats[3]).text('Set: ' + dataModel.data('setname')) : $(modelfeats[3]).addClass('hidden');
        modelfeats[4].innerHTML=`
        <a href="${dataModel.data('buy')}" class="modalBuyA" target="_blank" style="white-space:pre"><span class="ion-ios-cart incIconSize"></span>  Buy this card</a>
        `;

    });

    $('.shop-modal-hide').on('click', function(){
        $('#shop-modal').modal('hide');
    }); 

});

    /////////////////////////////////////
    //   CHANGE CLASSES RESPONSIVE     //
    /////////////////////////////////////  
// $(window).resize(function(){
// var width = $(window).width();
// if(width >= 300 && width <= 1024){
//     $('.item-1, .item-2, .item-3').removeClass('col-sm-3 col-xs-5').addClass('col-sm-5 col-xs-12');
//     $('.features-item').removeClass('col-md-3').addClass('col-md-6');
//     $('.item-3').removeClass('col-sm-offset-1').addClass('col-sm-offset-3');
//     $('.item-2').removeClass('col-xs-offset-2').addClass('col-xs-offset-0');       
// }
// else{
//     $('.item-1, .item-2, .item-3').removeClass('col-sm-5 col-xs-12').addClass('col-sm-3 col-xs-5');
//     $('.features-item').removeClass('col-md-6').addClass('col-md-3');
//     $('.item-3').removeClass('col-sm-offset-3').addClass('col-sm-offset-1');
//     $('.item-2').removeClass('col-xs-offset-0').addClass('col-xs-offset-2');        
// }
// })
// .resize();

//trigger the resize event on page load.

    /////////////////////////////////////
    //        STOP PINCH ZOOM          //
    /////////////////////////////////////  
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});