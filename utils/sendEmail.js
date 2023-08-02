const nodemailer = require("nodemailer")

module.exports = async (email, subject, text) => {
    try {
        // const transporter = nodemailer.createTestAccount({
        //  host:process.env.HOST,
        //  service:process.env.SERVICE,
        //  port:Number(process.env.EMAIL_PORT),
        //  secure:Boolean(process.env.SECURE),
        //  auth:{
        //     user:process.env.USER,
        //     pass:process.env.PASS
        //  }

        const transporter = nodemailer.createTransport({
            host: process.env.HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: Boolean(process.env.SECURE),
            service: process.env.SERVICE,
            auth: {
                user: process.env.SENDER_MAIL,
                pass: process.env.PASS,
            },
        })
        console.log(process.env.SENDER_MAIL),
            console.log(process.env.PASS),



            await transporter.sendMail({
                from: process.env.USER,
                to: email,
                subject: subject,
                text: text
            })
        console.log("Email Sent Successfully")
    } catch (error) {
        console.log("Email not Sent")
        console.log(error)
    }
}