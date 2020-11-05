
let manaCost = document.querySelectorAll('.mana-cost');
manaCost.forEach(card=>{
    if(card.innerHTML){
    let innerHTML = '';
    let newCard;
    if(card.innerHTML.includes('{')){
        newCard = card.innerHTML.split(''); newCard.splice(0,1); newCard.splice(-1,1);
        newCard = newCard.join('').split('}{');
    } else {
        newCard = card.innerHTML.split('');
    }
    newCard.forEach(simbol=>{
        if(simbol){
            simbol = simbol.split('/').join('');
            innerHTML += `<img class='symbol' src='/img/mana-cost/${simbol}.png' alt=${simbol} >`;
            }
        });
    card.innerHTML = innerHTML;
    }
    });

let colors = document.querySelectorAll('.colors');