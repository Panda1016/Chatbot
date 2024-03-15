"use strict";

const token = 'EAANOKbJLwIYBO903cx3ii6znOZC8ZBvw0L37tHkIsshGW9sASgUfLXCLhe35yvIRMOYQltQvMSZCzQsrVnz1J3FXG02ZAxDvmdaYVQMP7S9mMMEEUFkdvEoIXWDW4OXEsyj7l8IyH9yRVdSyVEz2knY0cb7dwUPxRGeUZCsaDqjV2IOb31ZA2NG9auqFViX2EpAFpKq6rOYmt7VECZCdhRrcELH0IlYmPcOPHjAZAsBOjzIZD';
let isCitySelected = false;
let selectedCity = ''

const request = require("request");
const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios").default;
const app = express().use(body_parser.json());
const PORT = process.env.PORT || 1337;


app.listen(PORT, () => console.log(`webhook is listening on port ${PORT}`));

app.post("/webhook", async (req, res) => {

    // console.log(JSON.stringify(req.body, null, 2));
    // console.log(req.body.entry[0].changes)


    if (req.body.object) {
        if (
            req.body.entry &&
            req.body.entry[0].changes &&
            req.body.entry[0].changes[0] &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0]
        ) {
            let phone_number_id = req.body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = req.body.entry[0].changes[0].value.messages[0].from;
            let msg_body = req.body.entry[0].changes[0].value.messages[0]

            console.log({
                phone_number_ids: req.body.entry.map(ent => ent.changes.map(change => change.value.metadata.phone_number_id).flat()).flat(),
                messages: req.body.entry.map(ent => ent.changes.map(change => change.value.messages.map(msg => JSON.stringify(msg)).flat()).flat()).flat()
            })

            if (msg_body.type === "text" && ['hello', 'hi'].includes(msg_body.text.body.toString().toLowerCase())) {
                await axios({
                    method: "POST", // Required, HTTP method, a string, e.g. POST, GET
                    url:
                        "https://graph.facebook.com/v12.0/" +
                        phone_number_id +
                        "/messages?access_token=" +
                        token,
                    data: {

                        messaging_product: "whatsapp",
                        to: from,
                        type: "interactive",
                        interactive: {
                            type: "button",

                            body: {

                                text: "How can I help you"
                            },
                            action: {

                                buttons: [
                                    {
                                        type: "reply",
                                        reply: {
                                            id: "address_form",
                                            title: "Fill Address",
                                        },
                                    },
                                    {
                                        type: "reply",
                                        reply: {
                                            id: "location",
                                            title: "Send Location",
                                        },
                                    },
                                ],
                            },

                        }
                        ,
                    },
                    headers: { "Content-Type": "application/json" }
                }).then((res) => {
                    console.log("Succesfully executed",
                        // res.data
                    )
                }).catch((err) => {
                    console.log("Error occured on the initialisation part", err)
                });
            }
            else if (msg_body.type === 'interactive' && msg_body.interactive.type === 'button_reply') {
                await sendCityInteractiveMessage(phone_number_id, token, from).then(res => console.log(`Successfully completed operation 2 ${res.data} end`)).catch((err) => {
                    console.log(`err on the first part ${err.message}`)
                })
                const responseBody = "Done";
                // response = {
                //     statusCode: 200,
                //     body: JSON.stringify(responseBody),
                //     isBase64Encoded: false,
                // };
            }
            else if (msg_body.type === "interactive" && isCitySelected) {
                if (msg_body.interactive.type === 'list_reply') {
                    let messageinfo =
                        msg_body.interactive.list_reply.id.split("_");
                    if (messageinfo[0] === "city") {
                        await sendCategoryInteractiveMessage(
                            phone_number_id,
                            token,
                            from,
                            messageinfo[1]
                        );
                    } else if (messageinfo[0] === "cat") {

                        await
                            sendReply(
                                phone_number_id,
                                token,
                                from,
                                `${messageinfo[2]} and ${messageinfo[3]}`
                            )
                                .catch((err) => {
                                    console.log("error on the second operation", err.message)
                                });
                    }
                    const responseBody = "Done";
                    // response = {
                    //     statusCode: 200,
                    //     body: JSON.stringify(responseBody),
                    //     isBase64Encoded: false,
                    // }
                }
            }
            else if (msg_body.type === "button_reply") {
                let messageinfo = msg_body.interactive.button_reply.id;
                if (messageinfo === "address_form") {
                    await sendAddressDeliveryMessage(
                        phone_number_id,
                        token,
                        from
                    );
                } else if (messageinfo === "location") {
                    await sendLocationMessage(
                        phone_number_id,
                        token,
                        from
                    );
                }
                else if (message.type === "order") {
                    await sendReplyButtons(phone_number_id, token, from);

                }
            }

        }
        res.sendStatus(200);
    } else {

        res.sendStatus(404);
    }
});


app.get("/webhook", (req, res) => {

    const verify_token = 'EAANOKbJLwIYBO903cx3ii6znOZC8ZBvw0L37tHkIsshGW9sASgUfLXCLhe35yvIRMOYQltQvMSZCzQsrVnz1J3FXG02ZAxDvmdaYVQMP7S9mMMEEUFkdvEoIXWDW4OXEsyj7l8IyH9yRVdSyVEz2knY0cb7dwUPxRGeUZCsaDqjV2IOb31ZA2NG9auqFViX2EpAFpKq6rOYmt7VECZCdhRrcELH0IlYmPcOPHjAZAsBOjzIZD';

    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];


    console.log({
        mode, token, challenge
    })

    if (mode && token) {
        if (mode === "subscribe" && token === verify_token) {

            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {

            res.sendStatus(403);
        }
    }
});


const sendReply = async (
    phone_number_id,
    whatsapp_token,
    to,
    reply_message
) => {
    try {
        console.log(phone_number_id, to, reply_message);
        let data = JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: {
                body: `Thank you for checking the bot Your City & Cat are ${reply_message}`
            },
        });

        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${whatsapp_token}`,
                "Content-Type": "application/json",
            },
            data: data,
        };
        const response = await axios.request(config);
        console.log("final part response", { ourResponse: response });
    } catch (err) {
        console.log(err);
    }
};


const sendCityInteractiveMessage = async (
    phone_number_id,
    whatsapp_token,
    to
) => {
    isCitySelected = true;
    try {
        let data = JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "interactive",
            interactive: {
                type: "list",
                body: {
                    text: "Welcome to Ecommerce Bot, Please select  from the options",
                },
                action: {
                    button: "Choose a City",
                    sections: [
                        {
                            title: "Choose a City",
                            rows: [
                                {
                                    id: `city_hyderabad`,
                                    title: "Hyderabad",
                                    //   description: "row-description-content-here",
                                },
                                {
                                    id: `city_delhi`,
                                    title: "Delhi",
                                    //   description: "row-description-content-here",
                                },
                                {
                                    id: `city_mumbai`,
                                    title: "Mumbai",
                                    //   description: "row-description-content-here",
                                },
                                {
                                    id: `city_banglore`,
                                    title: "Banglore",
                                    //   description: "row-description-content-here",
                                },
                                {
                                    id: `city_vizag`,
                                    title: "Vizag",
                                    //   description: "row-description-content-here",
                                },
                            ],
                        },

                        // },
                    ],
                },
            },
        });
        console.log({
            scd_data: JSON.parse(data)
        })
        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v12.0/${phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${whatsapp_token}`,
                "Content-Type": "application/json",
            },
            data: data,
        };
        const response = await axios.request(config);
        console.log("results on the operation", response);
    } catch (err) {
        console.log("error occured on the select city operation", {
            error: err.message
        });
    }
};

const sendCategoryInteractiveMessage = async (
    phone_number_id,
    whatsapp_token,
    to,
    city
) => {
    try {
        let data = JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "interactive",
            interactive: {
                type: "list",
                body: {
                    text: "Please select a category From the below Options",
                },
                action: {
                    button: "Select Category",
                    sections: [
                        {
                            title: "Choose a Category",
                            rows: [
                                {
                                    id: `cat_${city}_chains`,
                                    title: "Chain",
                                },
                                {
                                    id: `cat_${city}_necklace`,
                                    title: "necklace",
                                },
                                {
                                    id: `cat_${city}_bangles`,
                                    title: "Bangles",
                                },
                                {
                                    id: `cat_${city}_silver`,
                                    title: "Silver Items",
                                },
                            ],
                        },
                    ],
                },
            },
        });

        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${whatsapp_token}`,
                "Content-Type": "application/json",
            },
            data: data,
        };
        const response = await axios.request(config);
        console.log(response);
    } catch (err) {
        console.log(err);
    }
};
const sendMultipleProductMessage = async (
    phone_number_id,
    whatsapp_token,
    to,
    category
) => {
    try {
        let data = JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "interactive",
            interactive: {
                type: "product_list",
                header: {
                    type: "text",
                    text: `Jewellery Store ${category}`,
                },
                body: {
                    text: "We are dedicated to providing our customers with the safest and cleanest products, Please select products from below",
                },
                action: {
                    catalog_id: "176713595394228",
                    sections: [
                        {
                            title: "Jewellery Products",
                            product_items: [
                                {
                                    product_retailer_id: "tc5k2e4gfa",
                                },
                                {
                                    product_retailer_id: "wkey35bg0x",
                                },
                            ],
                        },
                    ],
                },
            },
        });

        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${whatsapp_token}`,
                "Content-Type": "application/json",
            },
            data: data,
        };
        const response = await axios.request(config);
        console.log(response);
    } catch (err) {
        console.log(JSON.stringify(err));
    }
};

const sendAddressDeliveryMessage = async (
    phone_number_id,
    whatsapp_token,
    to
) => {
    try {
        let data = JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "address_message",
                body: {
                    text: "Thanks for your order! Tell us what address you'd like this order delivered to.",
                },
                action: {
                    name: "address_message",
                    parameters: {
                        country: "US",
                    },
                },
            },
        });

        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${whatsapp_token}`,
                "Content-Type": "application/json",
            },
            data: data,
        };
        const response = await axios.request(config);
        console.log(response);
    } catch (err) {
        console.log("ERROR OCCURED IN DELIVERY MESSAGE", {
            error: Object.keys(err.response.data)
        });
    }
};

const sendLocationMessage = async (phone_number_id, whatsapp_token, to) => {
    try {
        let data = JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "location_request_message",
                body: {
                    type: "text",
                    text: "Please Send Your Current Location For Address",
                },
                action: {
                    name: "send_location",
                },
            },
        });

        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${whatsapp_token}`,
                "Content-Type": "application/json",
            },
            data: data,
        };
        const response = await axios.request(config);
        console.log(response);
    } catch (err) {
        console.log(JSON.stringify(err));
    }
};
const sendReplyButtons = async (phone_number_id, whatsapp_token, to) => {
    try {
        let data = JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: "Please select an option for sending the delivery",
                },
                action: {
                    buttons: [
                        {
                            type: "reply",
                            reply: {
                                id: "address_form",
                                title: "Fill Address",
                            },
                        },
                        {
                            type: "reply",
                            reply: {
                                id: "location",
                                title: "Send Location",
                            },
                        },
                    ],
                },
            },
        });

        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${whatsapp_token}`,
                "Content-Type": "application/json",
            },
            data: data,
        };
        const response = await axios.request(config);
        console.log(response);
    } catch (err) {
        console.log(JSON.stringify(err));
    }
};




const handleShowCatalog = async (phone_number, whatsapp_token, to) => {
    const products = [
        { id: 1, title: "Product A", description: "This  is a product A" },
        { id: 2, title: "Product b", description: "THis is product B" },
        // ... other products
    ];

    try {
        let data = JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "product_list",
                header: {
                    type: "text",
                    text: "Our popular items in the store",

                },
                body: {
                    text: "Click view catalog to order from the menu"
                },
                action: {
                    catalog_id: "YOUR_CATALOG_ID", // Replace with your product catalog ID
                    sections: [
                        {
                            title: "Products",
                            product_items: products.map((product) => ({
                                product_retailer_id: product.id
                            }))
                        }
                    ]
                }
            }
        })
        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v17.0/${phone_number}/messages`,
            headers: {
                Authorization: `Bearer ${whatsapp_token}`,
                "Content-Type": "application/json",
            },
            data: data,
        };
        const response = await axios.request(config);
        console.log(response);
    }
    catch (err) {
        console.log("error occured in the products section", err)
    }
}