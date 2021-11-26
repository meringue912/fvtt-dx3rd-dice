Hooks.on("chatMessage", function (chatlog, message, chatdata) {
  // dx 커맨드 정규표현식(11dx6+2, 11dx@6+2)
  const pattern = /^\d+(dx|DX)@?(\d+)?([+-]\d+)*$/;
  // dx 커맨드 분리
  const basic_express = /^\d+dx+(\d)?/; // 11dx6 (11dx@6)
  const bonus_express = /([+-]\d+)*$/; // +2
  
  let dices = 1;
  let critical = 10;
  let kept_explode_bonus = '';
  let roll = message;


  if (pattern.test(roll)) {
    roll = roll.replace("@","");
    roll = roll.replace("DX","dx");

    [dices, kept_explode_bonus] = roll.split`dx`.map(parseIntIfPossible);
    kept_explode_bonus = String(kept_explode_bonus);

    let bonus_formula = "";
    let bonus_result = 0;
    
    

    if(String(kept_explode_bonus).length != 0){
      
      if(isNaN(kept_explode_bonus)){
        let critical_temp = kept_explode_bonus.replace(bonus_express,"");
        critical = parseInt(critical_temp);


        bonus_formula= roll.replace(basic_express,"");

        let r_temp = new Roll(bonus_formula);
        bonus_result = r_temp.evaluate({minimize: false, maximize: false, async: false}).total


      }else{
        if(kept_explode_bonus[0] === "+" | kept_explode_bonus[0] === "-" ){
          
          bonus_formula= roll.replace(basic_express,"");
          let r_temp = new Roll(bonus_formula);
          bonus_result = r_temp.evaluate({minimize: false, maximize: false, async: false}).total
          
        }
        else{
          critical = kept_explode_bonus;
        }
        
      }
    }

    if(critical<2){
      return true;
    }

    let dice_result = 0;
    let rolling_list = [];

    while(true){
      let dict = {max: 0, roll: [0] };
      let roll_temp = [];
      let temp = 0;
      let max = 0;
      for(i=0;i<dices;i++){
        let r = new Roll("1d10");
        // console.warn = console.error = () => {}; // 에러숨기기
        let result = r.evaluate({minimize: false, maximize: false, async: false}).total;
        roll_temp.push(result)
        if(result >= critical){
          temp++;
          max = 10;
        }
        if(result > max){
          max = result;
        }

        
      }
      dict['max'] = max;
      dict['roll'] = roll_temp;
      rolling_list.push(dict);
      
      dice_result = dice_result + max;
      if(temp == 0){
        break;
      }
      else{
        dices = temp;
      }
    }

    dice_result = dice_result + bonus_result;


  
    let content = makeHtml(critical, message, dice_result, bonus_formula, rolling_list);

    let new_chat = {
      user: chatdata.user,
      speaker: chatdata.speaker,
      type: 3, 
      content: content,
    }
    let file = 'sounds/dice.wav';

    AudioHelper.play({src: file, volume: 0.8, autoplay: true, loop: false}, true);
    ChatMessage.create(new_chat, {})

    return false;
  } 

    
});

function makeHtml(critical, message, dice_result, bonus_formula, rolling_list){
  let html = '';

  let formula_script = '';
  let total_script = '';
  let rolling_script = '';
  let summary_script = '';

  let max_list = [];

  // Step 1. formula Script (11dx6+2)
  formula_script = '<span class="part-formula">'+ message + '</span>';

  // Step 2. total Script
  total_script = '<span class="part-total">' + String(dice_result) + '</span>';

  // Step 3. rolling_script([10,4,5,5] + [3,2,1])
  for(i=0;i<rolling_list.length;i++){
    let max = rolling_list[i]['max'];
    let roll = rolling_list[i]['roll'];
    max_list.push(max)

    rolling_script = rolling_script + '<ol class="dice-rolls">';
    for(j=0;j<roll.length;j++){
      if(parseInt(roll[j]) >= critical){
        rolling_script = rolling_script + '<li class="roll die d10 max">' + roll[j] + '</li>'
      }
      else{
        rolling_script = rolling_script + '<li class="roll die d10">' + roll[j] + '</li>'
      }
    }
    rolling_script = rolling_script + '</ol>';
  }

  // Step 4. summary Script
  summary_script = '<div class="dice-formula">'
  for(i=0;i<max_list.length;i++){
    if(i < max_list.length-1){
      summary_script = summary_script + max_list[i] + ' + ';
    }
    else{
      summary_script = summary_script + max_list[i]
    }
    
  }

  bonus_formula = bonus_formula.replace('+', ' + ');
  bonus_formula = bonus_formula.replace('-', ' - ');
  summary_script = summary_script + bonus_formula;
  summary_script = summary_script + '</div>';  

  // Step 5. Merge script
  html = html + '<div class="dice-formula">' + message + '</div>'
  html = html + '<div class="dice-tooltip" style="display: none;"><section class="tooltip-part"><div class="dice"><header class="part-header flexrow">'
  + formula_script + total_script + '</header>' + rolling_script
  + '</div></section></div>';
  html = html + summary_script;
  html = '<div class = "dice-roll"><div class="dice-result">'
  + html
  + '<h4 class="dice-total">' + dice_result + '</h4>'
  +'</div></div>';

  return html;
}


function parseIntIfPossible(x) {
  const numbers = /^[0-9]+$/;
  if (x.match(numbers)) {
    return parseInt(x);
  } else {
    return x;
  }
}



