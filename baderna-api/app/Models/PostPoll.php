<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostPoll extends Model
{
    protected $fillable = ['post_id', 'title', 'multiple', 'closes_at'];

    protected $casts = [
        'multiple'  => 'boolean',
        'closes_at' => 'datetime',
    ];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function options()
    {
        return $this->hasMany(PostPollOption::class, 'poll_id')->orderBy('position');
    }

    public function votes()
    {
        return $this->hasMany(PostPollVote::class, 'poll_id');
    }

    public function isClosed(): bool
    {
        return $this->closes_at !== null && $this->closes_at->isPast();
    }

    /**
     * Serializa a enquete pro frontend, resolvendo contagem de votos por opção,
     * total de votantes (distintos) e quais opções o viewer marcou.
     */
    public function serialize(?int $viewerId): array
    {
        $this->loadMissing('options');
        $options   = $this->options->sortBy('position')->values();
        $optionIds = $options->pluck('id')->all();

        $counts = empty($optionIds)
            ? collect()
            : PostPollVote::whereIn('option_id', $optionIds)
                ->selectRaw('option_id, COUNT(*) as c')
                ->groupBy('option_id')
                ->pluck('c', 'option_id');

        $myVotes = ($viewerId && ! empty($optionIds))
            ? PostPollVote::where('user_id', $viewerId)
                ->whereIn('option_id', $optionIds)
                ->pluck('option_id')
                ->all()
            : [];

        // Total de pessoas que votaram (distinto) — base do percentual por opção.
        $totalVoters = PostPollVote::where('poll_id', $this->id)
            ->distinct('user_id')
            ->count('user_id');

        return [
            'title'      => $this->title,
            'multiple'   => (bool) $this->multiple,
            'closesAt'   => $this->closes_at?->toIso8601String(),
            'closed'     => $this->isClosed(),
            'totalVotes' => $totalVoters,
            'options'    => $options->map(fn ($o) => [
                'id'        => $o->id,
                'text'      => $o->text,
                'imageUrl'  => $o->image_url,
                'votes'     => (int) ($counts[$o->id] ?? 0),
                'votedByMe' => in_array($o->id, $myVotes, true),
            ])->all(),
        ];
    }
}
