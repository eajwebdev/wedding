<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The guest list. Same tables the earlier Node.js version created, so an existing database is kept as it is.
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('invites')) {
            Schema::create('invites', function (Blueprint $table) {
                $table->increments('id');
                $table->char('code', 8)->unique(); // the ?invite= part of a personal link
                $table->string('name', 100);
                $table->unsignedTinyInteger('seats');
                $table->dateTime('created_at', 3);
            });
        }

        if (! Schema::hasTable('rsvps')) {
            Schema::create('rsvps', function (Blueprint $table) {
                $table->increments('id');
                // Unique: a guest with a link has one reply that their later answers overwrite.
                $table->unsignedInteger('invite_id')->nullable()->unique();
                $table->string('guest_name', 100);
                $table->enum('attendance', ['yes', 'no']);
                $table->unsignedTinyInteger('guest_count');
                $table->string('phone', 30)->default('');
                $table->string('message', 500)->default('');
                $table->dateTime('created_at', 3); // UTC; the latest reply when a guest changes their answer
                $table->foreign('invite_id', 'rsvps_invite')->references('id')->on('invites')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('rsvps');
        Schema::dropIfExists('invites');
    }
};
