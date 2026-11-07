/* contact: copy the center's address, with a fallback when the clipboard API is not available */
(function(){
  if(window.__factCopy)return; window.__factCopy=true;
  function done(b){b.classList.add('done');clearTimeout(b.__t);b.__t=setTimeout(function(){b.classList.remove('done');},2000);}
  document.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('[data-copy]'):null; if(!b)return;
    var v=b.getAttribute('data-copy');
    function fallback(){
      var ta=document.createElement('textarea'); ta.value=v; ta.setAttribute('readonly','');
      ta.style.position='fixed'; ta.style.top='0'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select();
      try{document.execCommand('copy');}catch(err){}
      document.body.removeChild(ta); done(b);
    }
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(v).then(function(){done(b);},fallback);
    else fallback();
  });
})();
