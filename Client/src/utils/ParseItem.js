import React from "react";

const parseItems = (iniItem) => {
	const items = iniItem.map(item => {
		let str = item.created_time;
		let indexOfT = str.indexOf('T');
		let date = str.substring(0, indexOfT);
		let time = str.substring(indexOfT + 1);

		return{
			...item,
			id: item._id["$oid"],
			date: date,
			time: time
		}
	});
  	return items;
}

export default parseItems;