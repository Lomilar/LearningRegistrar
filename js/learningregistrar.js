/*
 * Copyright 2002-2011 Eduworks
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 * More information about this project is available at:
 *
 *    https://github.com/Lomilar/LearningRegistrar
 */

function ajax_upload(url,data,filename,uploadreturn) {

	// prepare the MIME POST data
	var boundaryString = 'fritterboyfgfd4545645';
	var boundary = '--' + boundaryString;
	var nl = "\r\n";
	
	var requestbody = '--'+boundary + nl 
	+ 'Content-Disposition: form-data; name="file"; filename="' + filename + '"\r\n' 
	+ 'Content-Type: text/html' + nl 
	+ nl
	+ data
	+ nl
	+ "--"+boundary+"--";

	var random = randomString();
	$.ajax({
		url: url+"&sec="+random,
		type: "POST",
		data: requestbody,
		processData: false,
		dataType: "json", 
		contentType:"multipart/form-data; boundary=" + boundary + "",
		error: function(request, textStatus, errorThrown){
			$.ajax({
				url: url+"&sec="+random,
				type: "GET",
				dataType: "jsonp", 
				error: function(request, textStatus, errorThrown){
					alert(errorThrown);
				},
				success: function(data,textStatus){
					uploadreturn(data);
				}
	  	    });
		},
		success: function(data,textStatus){
			
					uploadreturn(data);
		}	  		
	});
}

function randomString() {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 8;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

var generatedMetadata = "";
function doStuff(data)
{
    document.getElementById('loading').style.display = "none";
    document.getElementById('content').style.display = "block";
    $(".errormsg").html(data.error);
    toggle(data);
    if (data.title != null && data.mimetype == "application/pdf")
        $(".titlex").html(data.title);
    else
        chrome.windows.getCurrent(function(window){
            chrome.tabs.getSelected(window.id, function(tab) {
                $(".titlex").html(tab.title);
            });
        });
    $(".description").html(data.description);
    $(".identifier").html(data.identifier);
         if (data.subject != null)             
      $(".keywords").html(data.subject.toString().replace(new RegExp(",","g"),", "));
    if (data.classification != null)
      $(".classification").html(formatClass(data.classification.toString()).replace(",",", "));
    $(".language").html(getlanguage(data.language));
    $(".readinglevel").html(formatGradeLevel(data.readinglevel));
    $(".readingtime").html(formatReadingTime(data.readingtime));
    $(".pages").html(formatPages(data.pages));
    $(".wordcount").html(data.wordcount);
    $(".uniquewordcount").html(data.uniquewordcount);
    $(".sentencecount").html(data.sentencecount);
    $(".averagewordlength").html(Math.round(data.averagewordlength*10)/10);
    $(".syllablecount").html(data.syllablecount);
	generatedMetadata = data;
}

var counter = 0;
var sumOfHtml = null;

chrome.extension.onRequest.addListener(function(response,sender,sendRequest){
    if (response.app == "chromeglance")
        if (response.action == "XcountMe")
        {
			counter = counter + 1;
        }
        else if (response.action == "XgetMeData")
        {
			if (response.data != null)
			{
				if (sumOfHtml == null)
					sumOfHtml = "";
                sumOfHtml = sumOfHtml + response.data;
            }
        }
        else if (response.action == "Xgo")
        {
            if (--counter == 0) 
            {
				currentUrl = response.url;
                if (sumOfHtml != null)  
                    ajax_upload("http://sphinx.eduworks.com/learningregistry/getMetadata?url="+response.url,sumOfHtml,"blah.html",function(data){
                        doStuff(data);
                    });
                else
                    alert("File types other than HTML not currently supported.");
            }
        }
});
var currentUrl;

function sign(data)
{
	openpgp.config.config.prefer_hash_algorithm = 8; 
	openpgp.config.write();
	//IT:0.49.0 Creating signature
	delete data.doc_id;
	delete data.publishing_node;
	delete data.update_timestamp;
	delete data.node_timestamp;
	delete data.create_timestamp;
	
	var temp_digital_signature = data.digital_signature;
	delete data.digital_signature;
	
	var bencoded = bencode(data);
	var hashed = str_sha256(bencoded);
	if (!openpgp.keyring.hasPrivateKey())
	{
		alert("No private key found.");
	}
	var signedHash = openpgp.write_signed_message(openpgp.keyring.privateKeys[0].obj,hashed);
	
	data.digital_signature = temp_digital_signature;
	signedHash = signedHash.replace("\r\n","\n");
	return signedHash;
}

openpgp.init();

function clearPrivateKey()
{
	openpgp.keyring.privateKeys = [];
	openpgp.keyring.store();
}

function importPrivateKey() {
	openpgp.keyring.privateKeys = [];
	//openpgp.keyring.publicKeys = [];
	var privatekey = $(".privateKeyTextArea").val();
	//var publickey = $(".publicKeyTextArea").val();
	openpgp.keyring.importPrivateKey(privatekey);
	openpgp.keyring.store();
	$("#privateKeyDiv").hide();
	$("#content").show();
}

function showImportPrivateKey() {
	$("#privateKeyDiv").show();
	$("#content").hide();
}

function fetchEnvelope(resourceData,currentUrl,isParadata)
{
	var useSigned = confirm("Please click OK if you would like to use a signed request. You will be required to have a PGP Private key.");
	if (useSigned)
	{
	var tempResult = {
			doc_type: "resource_data", 
			resource_data: resourceData,
			digital_signature: {
				key_owner: openpgp.keyring.privateKeys[0].obj.userIds[0].text,
				key_location: [prompt("Please insert the URL of the third party who has signed your key.","http://keys.gnupg.net/pks/lookup?op=get&search=0xD89734AE9DD62046")],
				signing_method: "LR-PGP.1.0"
			},
			keys: ["metadata","Eduworks","generated","Metaglance"], 
			resource_data_type: isParadata ? "paradata":"metadata", 
			payload_placement: "inline", 
			payload_schema: isParadata ? ["LR Paradata 1.0"]:["dc"], 
			doc_version: "0.23.0", 
			active: "true",
			publishing_node: "local",
			resource_locator: currentUrl, 
			identity: {
				owner: "metaglance.com", 
				submitter: "LearningRegistrar", 
				submitter_type: "agent", 
				curator: "metaglance.com"
				}
			};
			
		tempResult.digital_signature.signature=sign(tempResult);
		tempResult.active = true;
		return tempResult;
	}
		else
			return {
			doc_type: "resource_data", 
			resource_data: resourceData, 
			keys: ["metadata","Eduworks","generated","Metaglance"], 
			resource_data_type: isParadata ? "paradata":"metadata", 
			payload_placement: "inline", 
			payload_schema: isParadata ? ["LR Paradata 1.0"]:["dc"], 
			doc_version: "0.23.0", 
			active: true,
			publishing_node: "local",
			resource_locator: currentUrl, 
			identity: {
				owner: "metaglance.com", 
				submitter: "LearningRegistrar", 
				submitter_type: "agent", 
				curator: "metaglance.com",
				signer: "http://keyserver.pgp.com"
				}
			};
}
function toLearningRegistry()
{
	var result = fetchEnvelope(generatedMetadata,currentUrl);
	$.ajax({
		url: "http://lrdev01.learningregistry.org/publish",
		type: "POST",
		data: JSON.stringify({documents:[result]}),
		contentType: "application/json",
		success: function(data){
			chrome.tabs.create({url:"http://lrdev01.learningregistry.org/obtain?request_id="+data.document_results[0].doc_ID+"&by_doc_ID=t"});
		}
    });
}
function submitParadataToLearningRegistry(paradataChunk)
{
	var result = fetchEnvelope(paradataChunk,currentUrl);
	$.ajax({
		url: "http://lrdev01.learningregistry.org/publish",
		type: "POST",
		data: JSON.stringify({documents:[result]}),
		contentType: "application/json",
		success: function(data){
			chrome.tabs.create({url:"http://lrdev01.learningregistry.org/obtain?request_id="+data.document_results[0].doc_ID+"&by_doc_ID=t"});
		}
    });
}

function keyCheck()
{
     var response = confirm('This plugin uses MetaGlance, an Eduworks automated metadata generation web service. By clicking OK, you agree that you will use of this service for research purposes only, that Eduworks has the right to retain any data passed to or generated by the service, and that the you will attribute the metadata to Eduworks, including without limitation as part of its submission to the Learning Registry.');

     if (response)
        chrome.windows.getCurrent(function(window){
            chrome.tabs.getSelected(window.id, function(tab) {
                chrome.tabs.sendRequest(tab.id, {action: "countMe",app:"chromeglance"});
                chrome.tabs.sendRequest(tab.id, {action: "getMeData",app:"chromeglance"});
                chrome.tabs.sendRequest(tab.id, {action: "go",url:tab.url,app:"chromeglance"});
                $(".titlex").html(tab.title);
            });
        });
	else
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.update(tab.id, { selected: true } )
		});
}
function goToMetaglance()
{
    chrome.tabs.create({url:"http://www.metaglance.com"});
}
function goToEduworks()
{
    chrome.tabs.create({url:"http://www.eduworks.com"});
}