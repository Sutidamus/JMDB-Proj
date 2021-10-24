/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
class EntryController {
	constructor(){
		//document.querySelector("")
	}
}

class ProfileController {
	constructor(){
		document.querySelector()
	}
}

if(document.querySelector("#collectionMain")){
	// Collection Page logic
	document.querySelector("#collectionShowFilter").onclick = (event) => {
		// event.target.style.backgroundColor = "white";
		let form = document.querySelector("#collectionFilterForm")
		if(form.style.display == "block"){
			form.style.display = "none"
		}
		else form.style.display = "block";
	}
	
	document.querySelector("#collectionFilterBtn").onclick = (event)=> {
		event.preventDefault();
	}

	// document.querySelectorAll(".collectionDelBtn")[0].onclick = (event) =>{
	// 	let btn = event.target;
	// 	console.log(btn.album);
	// }
}