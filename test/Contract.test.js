const {exec} = require('child_process');
const signale = require('signale');
const {snapshot, update_config, session, revert, NET, push, remove_config_update} = require('./setup');

const createContract = async() => {
    signale.info('Creating Contract proxy ...');
    return new Promise((ok, ko) => {
        exec(`./node_modules/.bin/zos create Contract --init initialize --network ${NET}`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return ko(err);
            }
            signale.success('Created Contract proxy');
            ok();
        })
    })
};

const create = async () => {
    await createContract();
};

contract('Contract', () => {

    before(() => {
        return update_config()
            .then(session)
            .then(push)
            .then(create)
            .then(snapshot)
            .then((res => {
                this.snap_id = res;
            }).bind(this))
            .then()
    });

    after(() => {
        return remove_config_update()
    });

    beforeEach(() => {
        return revert(this.snap_id)
            .then((res) => {
                if (!res) throw new Error('Reverting state failed')
            })
    });

    it('Dummy', () => {

    });

});
