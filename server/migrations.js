import { Migrations } from 'meteor/percolate:migrations';
import { backupMongo } from './mongoBackup';

import { MigrateV1 } from './migrate_v1'
import { MigrateV2 } from './migrate_v2'

 Migrations.add({
     version: 1,
     up() {MigrateV1.up();},
     down() {MigrateV1.down();}
 });

Migrations.add({
    version: 2,
    up() {MigrateV2.up();},
    down() {MigrateV2.down();}
});

// ----------------------------------------------------------------
function findLatestVersion() {
    let max = 0;

    Migrations._list.forEach((entry) => {
        max = Math.max(entry.version, max);
    });

    return max;
}

export const handleMigration = function () {
    const latestVersion = findLatestVersion(),
        currentVersion = Migrations.getVersion();

    if (currentVersion < latestVersion) {
        backupMongo(process.env.MONGO_URL);
        Migrations.migrateTo('latest');
    }
};