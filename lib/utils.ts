//
// Utilities
//

export function replaceStrings(s:string,rv:{[name:string]: string}){
    let r = s;
    for(let k in rv){
        while(r.indexOf(k) >= 0){
            r = r.replace(k,rv[k]);
        }
    }
    return r;
}

export function escapeChars(s:string, chars:string){
    var r:string = '';
    const l = s.length;
    for(var i=0;i<l;i++){
        var c = s.charAt(i);
        if(chars.indexOf(c) >= 0){
            c = '\\' + c;
        }
        r = r + c;
    }
    return r;
}
