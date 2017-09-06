'use strict'

var assign = require('lodash/assign');
var lodash = require('lodash');
var mongodb = require('mongodb');
var {Pxl} = require('./index');
var admin = require("firebase-admin");
var isEqual = lodash.isEqual;



class FirebasePersistenceLayer extends Pxl.PersistenceLayerBase {

    constructor({collectionPxls = 'notification', collectionLinks = 'links', alwaysShortenWithNewLinkId = false,db} = {}) {

        super()

        this.db = db

        this.collectionPxls = this.db.ref(`/${collectionPxls}/`);
        this.collectionLinks = this.db.ref(`/${collectionLinks}/`);
        this.alwaysShortenWithNewLinkId = alwaysShortenWithNewLinkId

    }

    checkAndAddPxl(pxl, metadata) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established.')
            })
        }
        // if (metadata.type !== 'open') return new Promise((resolve, reject) => resolve(null));
        // console.log(pxl);
        // console.log(metadata);
        return this.collectionPxls.child(pxl)
            .update(assign({}, metadata, {
                key: pxl,
                mail_sent: Date.now(),
                mail_open: false
            }))
            .then(() => {
                return assign({}, metadata, {
                    key: pxl,
                    mail_sent: Date.now(),
                    mail_open: false
                });
            })
            .catch((err) => {
                throw err
            })

    }

    logPxl(pxl, metadata) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established.')
            })
        }
        console.log('Log Firebase PXL');
        return this.collectionPxls.child(`${pxl}`)
            .once('value')
            .then(result => {
                // const count = result.val().count + 1;
                return this.collectionPxls.child(`${pxl}`).update({email_open: Date.now()});
            })
            .then(() => {
                return this.collectionPxls.child(`${pxl}`)
                    .once('value');
            })
            .then(result => result.val())
            .catch(err => {
                throw err;
            });

    }

    checkAndAddLink(linkId, link, _skipExistingLinkCheck = false) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established.')
            });
        }

        if (!_skipExistingLinkCheck && this.alwaysShortenWithNewLinkId === false) {

            return this.collectionLinks.once('value')
                .then(_links => {
                    if (!_links.val()) return Promise.resolve(null);
                    const links = Object.keys(_links.val()).map(key => _links.val()[key]);
                    // console.log(links);
                    return Promise.resolve(links.filter(_link => _link.link === link)[0]);
                })
                .then((existingLink) => {
                    // console.log(existingLink);
                    if (existingLink) {
                        console.log('Link Found return', existingLink.linkId);
                        return existingLink;
                    }

                    return this.checkAndAddLink(linkId, link, true)

                });

        }

        return this.collectionLinks.child(`${linkId}`)
            .update({
                linkId,
                link
            })
            .then(() => {
                console.log('New Link return', linkId);
                return {
                    linkId,
                    link
                };

            })
            .catch((err) => {
                throw err
            });

    }

    lookupLink(linkId) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established.')
            });
        }
        console.log(linkId);
        return this.collectionLinks.child(`${linkId}`)
            .once('value')
            .then((link) => {

                if (!link.val()) {
                    throw new Error('Link not found.')
                }

                return link.val().link;

            })

    }

}

module.exports = FirebasePersistenceLayer;