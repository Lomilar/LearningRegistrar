// GPG4Browsers - An OpenPGP implementation in javascript
// Copyright (C) 2011 Recurity Labs GmbH
// 
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 2.1 of the License, or (at your option) any later version.
// 
// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
// 
// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

/**
 * Wrapper function for the base64 codec. 
 * This function encodes a String (message) in base64 (radix-64)
 * @param message [String] the message to encode
 * @return [String] the base64 encoded data
 */
function openpgp_encoding_base64_encode(message) {
	return s2r(message);
}


/**
 * Wrapper function for the base64 codec.
 * This function decodes a String(message) in base64 (radix-64)
 * @param message [String] base64 encoded data
 * @return [String] raw data after decoding
 */
function openpgp_encoding_base64_decode(message) {
	return r2s(message);
}

/**
 * Wrapper function for jquery library.
 * This function escapes HTML characters within a string. This is used to prevent XSS.
 * @param message [String] message to escape
 * @return [String] html encoded string
 */
function openpgp_encoding_html_encode(message) {
	if (message == null)
		return "";
	return $('<div/>').text(message).html();
}

/**
 * create a EME-PKCS1-v1_5 padding (See RFC4880 13.1.1)
 * @param message [String] message to be padded
 * @param length [Integer] length to the resulting message
 * @return [String] EME-PKCS1 padded message
 */
function openpgp_encoding_eme_pkcs1_encode(message, length) {
	if (message.length > length-11)
		return -1;
	var result = "";
	result += String.fromCharCode(0);
	result += String.fromCharCode(2);
	for (var i = 0; i < length - message.length - 3; i++) {
		result += String.fromCharCode(openpgp_crypto_getPseudoRandom(1,255));
	}
	result += String.fromCharCode(0);
	result += message;
	return result;
}

/**
 * ASN1 object identifiers for hashes (See RFC4880 5.2.2)
 */
hash_headers = new Array();
hash_headers[1]  = [0x30,0x20,0x30,0x0c,0x06,0x08,0x2a,0x86,0x48,0x86,0xf7,0x0d,0x02,0x05,0x05,0x00,0x04,0x10];
hash_headers[3]  = [0x30,0x21,0x30,0x09,0x06,0x05,0x2B,0x24,0x03,0x02,0x01,0x05,0x00,0x04,0x14];
hash_headers[2]  = [0x30,0x21,0x30,0x09,0x06,0x05,0x2b,0x0e,0x03,0x02,0x1a,0x05,0x00,0x04,0x14];
hash_headers[8]  = [0x30,0x31,0x30,0x0d,0x06,0x09,0x60,0x86,0x48,0x01,0x65,0x03,0x04,0x02,0x01,0x05,0x00,0x04,0x20];
hash_headers[9]  = [0x30,0x41,0x30,0x0d,0x06,0x09,0x60,0x86,0x48,0x01,0x65,0x03,0x04,0x02,0x02,0x05,0x00,0x04,0x30];
hash_headers[10] = [0x30,0x51,0x30,0x0d,0x06,0x09,0x60,0x86,0x48,0x01,0x65,0x03,0x04,0x02,0x03,0x05,0x00,0x04,0x40];
hash_headers[11] = [0x30,0x31,0x30,0x0d,0x06,0x09,0x60,0x86,0x48,0x01,0x65,0x03,0x04,0x02,0x04,0x05,0x00,0x04,0x1C];

/**
 * create a EMSA-PKCS1-v1_5 padding (See RFC4880 13.1.3)
 * @param algo [Integer] hash algorithm type used
 * @param data [String] data to be hashed
 * @param keylength [Integer] key size of the public mpi in bytes
 * @return the [String] hashcode with pkcs1padding as string
 */
function openpgp_encoding_emsa_pkcs1_encode(algo, data, keylength) {
	var data2 = "";
	data2 += String.fromCharCode(0x00);
	data2 += String.fromCharCode(0x01);
	for (var i = 0; i < (keylength - hash_headers[algo].length - 3 - openpgp_crypto_getHashByteLength(algo)); i++)
		data2 += String.fromCharCode(0xff);
	data2 += String.fromCharCode(0x00);
	
	for (var i = 0; i < hash_headers[algo].length; i++)
		data2 += String.fromCharCode(hash_headers[algo][i]);
	
	data2 += openpgp_crypto_hashData(algo, data);
	return new BigInteger(util.hexstrdump(data2),16);
}

/**
 * extract the hash out of an EMSA-PKCS1-v1.5 padding (See RFC4880 13.1.3) 
 * @param data [String] hash in pkcs1 encoding
 * @return the hash as string
 */
function openpgp_encoding_emsa_pkcs1_decode(algo, data) { 
	var i = 0;
	if (data.charCodeAt(0) == 0) i++;
	else if (data.charCodeAt(0) != 1) return -1;
	else i++;

	while (data.charCodeAt(i) == 0xFF) i++;
	if (data.charCodeAt(i++) != 0) return -1;
	var j = 0;
	for (j = 0; j < hash_headers[algo].length && j+i < data.length; j++) {
		if (data.charCodeAt(j+i) != hash_headers[algo][j]) return -1;
	}
	i+= j;	
	if (data.substring(i).length < openpgp_crypto_getHashByteLength(algo)) return -1;
	return data.substring(i);
}