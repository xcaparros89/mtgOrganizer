function clicked(mana){
    let manaB = document.getElementById(mana);
    if(manaB.classList.contains('color-unchecked')){
        manaB.classList.remove("color-unchecked");
        manaB.classList.add("color-checked");
    }else{
        manaB.classList.remove("color-checked");
        manaB.classList.add("color-unchecked");
    }
    console.log(mana)
}

function showHide(el){
    let advParams = document.getElementById(el);
    if(advParams.classList.contains('hide-element')){
        advParams.classList.remove('hide-element');
    } else{
        advParams.classList.add('hide-element');
    }
}

function changeArrow(){
    let advArrow = document.getElementById('adv-arrow')
        if(advArrow.classList.contains('ion-android-arrow-dropleft-circle')){
            advArrow.classList.remove('ion-android-arrow-dropleft-circle');
            advArrow.classList.add('ion-android-arrow-dropdown-circle');
        }else{
            advArrow.classList.remove('ion-android-arrow-dropdown-circle');
            advArrow.classList.add('ion-android-arrow-dropleft-circle');
        }
        showHide('advParams')
}